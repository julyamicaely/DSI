export type DailyProgressEntry = {
  value: number;
  target: number;
  percentage: number;
};

export type Goal = {
  id: string;
  habitId: string;
  habitName: string;
  target: string;
  deadline: Date;
  progress: string[];
  dailyProgress?: Record<string, DailyProgressEntry>;
  createdAt: number;
  dailyTarget?: number;
};

export type GoalFormValues = {
  habitId: string;
  habitName: string;
  target: string;
  deadline: Date;
  progress?: string[];
  dailyTarget?: number;
  dailyProgress?: Record<string, DailyProgressEntry>;
};

export interface Habit {
  id: string;
  name: string;
  time: any;
  reminders?: Date[];
  weekdays?: number[];
}

export const pad2 = (value: number) => (value < 10 ? `0${value}` : `${value}`);

export const dateKey = (date: Date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

export const parseDateKey = (key: string) => {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
};

export const isSameDay = (a: Date, b: Date) => dateKey(a) === dateKey(b);

export const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);

export const addMonths = (date: Date, amount: number) =>
  new Date(date.getFullYear(), date.getMonth() + amount, 1);

export const getMonthMatrix = (monthDate: Date) => {
  const firstDay = startOfMonth(monthDate);
  const startWeekDay = firstDay.getDay();
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - startWeekDay);

  const matrix: Date[][] = [];
  const cursor = new Date(gridStart);

  for (let week = 0; week < 6; week++) {
    const days: Date[] = [];
    for (let day = 0; day < 7; day++) {
      days.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    matrix.push(days);
  }
  return matrix;
};

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export const getMonthLabel = (date: Date) => `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;

export const formatDisplayDate = (date: Date) =>
  `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;
export const isValidDayForHabit = (habit: Habit | null | undefined, date: Date) => {

  if (!habit?.weekdays || habit.weekdays.length === 0) return false;
  const dayOfWeek = date.getDay();
  return habit.weekdays.includes(dayOfWeek);
};

export const calculateMonthlyProgress = (
  goal: Goal,
  referenceMonth: Date = new Date(),
  habitWeekdays?: number[],
  deadline?: Date
) => {
  const year = referenceMonth.getFullYear();
  const monthIndex = referenceMonth.getMonth();

  
  const today = new Date();
  const limitDate = deadline ? new Date(Math.min(deadline.getTime(), today.getTime())) : today;

  const daysInMonth: Date[] = [];
  const totalDays = new Date(year, monthIndex + 1, 0).getDate();

  for (let day = 1; day <= totalDays; day++) {
    daysInMonth.push(new Date(year, monthIndex, day));
  }

  const validDays = daysInMonth.filter((day) => {
    if (day > limitDate) return false;
    if (habitWeekdays && habitWeekdays.length > 0 && !habitWeekdays.includes(day.getDay())) return false;
    return true;
  });

  if (validDays.length === 0) return 0;

  const monthPrefix = `${year}-${pad2(monthIndex + 1)}`;
  const completedThisMonth = goal.progress.filter((day) => {
    if (!day.startsWith(monthPrefix)) return false;
    const parsed = parseDateKey(day);
    return parsed <= limitDate && (!habitWeekdays || habitWeekdays.includes(parsed.getDay()));
  }).length;

  return Math.min(100, Math.round((completedThisMonth / validDays.length) * 100));
};

export const calculateDailyProgress = (
  progress: string[],
  day: Date,
  dailyTarget: number
): DailyProgressEntry => {
  const key = dateKey(day);
  const value = progress.includes(key) ? dailyTarget : 0;
  return {
    value,
    target: dailyTarget,
    percentage: calculateDailyPercentage(value, dailyTarget),
  };
};

export const calculateDailyPercentage = (value: number, target: number): number => {
  if (!target || target <= 0) return 0;
  return Math.min(100, Math.round((value / target) * 100));
};
