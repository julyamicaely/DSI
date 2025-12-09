// src/utils/goalUtils.ts
import { Goal, DailyProgressEntry } from '../types';

export const getDailyProgressDateKey = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const updateGoalProgress = (
  currentGoals: Goal[],
  goalId: string,
  dateKey: string,
  entry: DailyProgressEntry
): Goal[] => {
  return currentGoals.map(goal => {
    if (goal.id !== goalId) return goal;

    const originalEntry = goal.dailyProgress?.[dateKey] || { progress: 0, target: goal.dailyTarget || 1, percentage: 0 };
    const progressDifference = entry.progress - originalEntry.progress;

    const newDailyProgress = {
      ...(goal.dailyProgress || {}),
      [dateKey]: entry,
    };

    let newProgress = [...(goal.progress || [])];
    const isCompleted = entry.percentage >= 100;
    const alreadyInList = newProgress.includes(dateKey);

    if (isCompleted && !alreadyInList) {
      newProgress.push(dateKey);
    } else if (!isCompleted && alreadyInList) {
      newProgress = newProgress.filter(d => d !== dateKey);
    }

    return {
      ...goal,
      dailyProgress: newDailyProgress,
      progress: newProgress,
      progressTotal: (goal.progressTotal || 0) + progressDifference,
    };
  });
};

export const rollbackGoalProgress = (
  currentGoals: Goal[],
  goalId: string,
  dateKey: string
): Goal[] => {
    return currentGoals.map(goal => {
        if (goal.id !== goalId) return goal;

        const originalDailyProgress = goal.dailyProgress || {};
        const entryBeingRolledBack = originalDailyProgress[dateKey];

        if (!entryBeingRolledBack) return goal; 

        const originalProgressTotal = goal.progressTotal || 0;
        
        const { [dateKey]: _, ...restDailyProgress } = originalDailyProgress;

        const newProgress = (goal.progress || []).filter(d => d !== dateKey);
        
        return {
            ...goal,
            dailyProgress: restDailyProgress,
            progress: newProgress,
            // A lógica de rollback simples: remove o valor que foi adicionado/modificado
            progressTotal: originalProgressTotal - entryBeingRolledBack.progress,
        };
    });
};