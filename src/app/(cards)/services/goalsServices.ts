import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  Timestamp,
  getDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { auth, db } from '../../../../firebaseConfig';
import type { Goal, GoalFormValues } from '../../../lib/goals';

const goalsRef = collection(db, 'goals');

const ensureUser = () => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Usuário não autenticado');
  }
  return user;
};

const mapSnapshotToGoal = (snapshot: QueryDocumentSnapshot<DocumentData>): Goal => {
  const data = snapshot.data();
  const deadlineValue = data.deadline;
  const deadline = deadlineValue instanceof Timestamp
    ? deadlineValue.toDate()
    : new Date(deadlineValue ?? Date.now());

  return {
    id: snapshot.id,
    habitId: data.habitId ?? '',
    habitName: data.habitName ?? '',
    target: data.target ?? '',
    deadline,
    progress: Array.isArray(data.progress) ? data.progress : [],
    createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
  };
};

export const addGoal = async (goalData: GoalFormValues): Promise<Goal> => {
  const user = ensureUser();
  const createdAt = Date.now();
  const payload = {
    habitId: goalData.habitId,
    habitName: goalData.habitName,
    target: goalData.target,
    deadline: Timestamp.fromDate(goalData.deadline),
    progress: goalData.progress ?? [],
    createdAt,
    userId: user.uid,
  };

  const document = await addDoc(goalsRef, payload);

  return {
    id: document.id,
    habitId: payload.habitId,
    habitName: payload.habitName,
    target: payload.target,
    deadline: goalData.deadline,
    progress: payload.progress,
    createdAt,
  };
};

export const listGoals = async (): Promise<Goal[]> => {
  const user = ensureUser();
  const q = query(goalsRef, where('userId', '==', user.uid));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((docSnapshot: QueryDocumentSnapshot<DocumentData>) => mapSnapshotToGoal(docSnapshot))
    .sort((a: Goal, b: Goal) => b.createdAt - a.createdAt);
};

export const updateGoal = async (id: string, goalData: GoalFormValues) => {
  ensureUser();
  const ref = doc(db, 'goals', id);
  const updates: Record<string, unknown> = {
    habitId: goalData.habitId,
    habitName: goalData.habitName,
    target: goalData.target,
  };

  if (goalData.deadline) {
    updates.deadline = Timestamp.fromDate(goalData.deadline);
  }

  if (goalData.progress) {
    updates.progress = goalData.progress;
  }

  await updateDoc(ref, updates);
};

export const deleteGoal = async (id: string) => {
  ensureUser();
  const ref = doc(db, 'goals', id);
  await deleteDoc(ref);
};

export const markGoalAsCompleted = async (goalId: string, date: string) => {
  const user = ensureUser();
  const ref = doc(db, 'goals', goalId);
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    throw new Error('Meta não encontrada');
  }

  const data = snapshot.data();
  if (data?.userId && data.userId !== user.uid) {
    throw new Error('Acesso negado');
  }

  const currentProgress: string[] = Array.isArray(data?.progress) ? [...data.progress] : [];
  const index = currentProgress.indexOf(date);

  if (index >= 0) {
    currentProgress.splice(index, 1);
  } else {
    currentProgress.push(date);
  }

  await updateDoc(ref, { progress: currentProgress });
  return currentProgress;
};

export type { Goal };