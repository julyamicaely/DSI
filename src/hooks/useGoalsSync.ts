import { useCallback, useEffect, useState } from 'react';
import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';
import type { Goal, Habit } from '../lib/goals';

type HabitDoc = Habit & { userId?: string };

const mapGoal = (docSnapshot: any): Goal => {
  const data = docSnapshot.data();
  const deadlineValue = data.deadline;
  const deadline = deadlineValue instanceof Timestamp
    ? deadlineValue.toDate()
    : new Date(deadlineValue ?? Date.now());

  return {
    id: docSnapshot.id,
    habitId: data.habitId ?? '',
    habitName: data.habitName ?? '',
    target: data.target ?? '',
    deadline,
    progress: Array.isArray(data.progress) ? data.progress : [],
    dailyProgress: data.dailyProgress ?? {},
    createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
  };
};

export const useGoalsSync = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [habits, setHabits] = useState<HabitDoc[]>([]);
  const [loading, setLoading] = useState(true);

  const subscribe = useCallback(() => {
    const user = auth.currentUser;
    if (!user) {
      setGoals([]);
      setHabits([]);
      setLoading(false);
      return () => {};
    }

    const habitsQuery = query(collection(db, 'habits'), where('userId', '==', user.uid));
    const goalsQuery = query(collection(db, 'goals'), where('userId', '==', user.uid));

    const unsubHabits = onSnapshot(habitsQuery, (snapshot) => {
      const nextHabits = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as HabitDoc;
        const { id: _id, ...rest } = data;
        return { id: docSnap.id, ...rest };
      });
      setHabits(nextHabits);
    });

    const unsubGoals = onSnapshot(goalsQuery, (snapshot) => {
      const nextGoals = snapshot.docs
        .map((docSnap) => mapGoal(docSnap))
        .sort((a: Goal, b: Goal) => b.createdAt - a.createdAt);
      setGoals(nextGoals);
    });

    setLoading(false);
    return () => {
      unsubHabits();
      unsubGoals();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = subscribe();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [subscribe]);

  return { goals, habits, loading };
};
