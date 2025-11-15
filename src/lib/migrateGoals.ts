import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GoalFormValues } from './goals';
export const addGoal = async (payload: GoalFormValues) => {
    // Implementation here
};
const LEGACY_KEY = 'goals.v2';

type LegacyGoal = {
  id: string;
  name: string;
    time?: string;
  history?: string[];
};
type HabitLike = {
  id: string;
  name: string;
};
const normalize = (value: string | undefined) => (value ?? '').trim().toLowerCase();

export const migrateLegacyGoals = async (knownHabits: HabitLike[] = []) => {
  const raw = await AsyncStorage.getItem(LEGACY_KEY);
  if (!raw) {
    return { migrated: 0 };
  }

  let parsed: LegacyGoal[] = [];
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    await AsyncStorage.removeItem(LEGACY_KEY);
    return { migrated: 0 };
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    await AsyncStorage.removeItem(LEGACY_KEY);
    return { migrated: 0 };
  }

  let migrated = 0;
  for (const legacyGoal of parsed) {
    const match = knownHabits.find(
      (habit) => normalize(habit.name) === normalize(legacyGoal.name)
    );

    if (!match) {
      continue;
    }

    const payload: GoalFormValues = {
      habitId: match.id,
      habitName: match.name,
      target: legacyGoal.time || legacyGoal.name || 'Meta',
      deadline: new Date(),
      progress: Array.isArray(legacyGoal.history) ? legacyGoal.history : [],
    };
        try {
      await addGoal(payload);
      migrated++;
    } catch (error) {
      // Continua para as demais metas, mesmo em caso de erro isolado
    }
  }

  await AsyncStorage.removeItem(LEGACY_KEY);
  return { migrated };
};