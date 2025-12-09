import { Habit } from '../types';

export const isDateValidForHabit = (date: Date, habit: Habit): boolean => {
  if (!habit) return true;

  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ...
  const dateString = date.toISOString().split('T')[0];

  if (habit.frequency === 'daily') {
    return true;
  } else if (habit.frequency === 'weekly') {
    // habit.weekdays is array of numbers (0-6)
    return habit.weekdays ? habit.weekdays.includes(dayOfWeek) : false;
  } else if (habit.frequency === 'monthly' || habit.frequency === 'yearly') {
    // habit.selectedDates is object { 'YYYY-MM-DD': { selected: true } }
    return habit.selectedDates ? !!habit.selectedDates[dateString] : false;
  }

  return true;
};
