export type Goal = {
  id: string;
  habitId: string;
  habitName: string;
  target: string;
  deadline: Date;
  progress: string[];
  createdAt: number;
};
export type GoalFormValues = {
  habitId: string;
  habitName: string;
  target: string;
  deadline: Date;
  progress?: string[];
};

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

export const calculateMonthlyProgress = (goal: Goal, referenceMonth: Date = new Date()) => {
  const year = referenceMonth.getFullYear();
  const monthIndex = referenceMonth.getMonth();
  const totalDays = new Date(year, monthIndex + 1, 0).getDate();
  if (!totalDays) return 0;

  const monthPrefix = `${year}-${pad2(monthIndex + 1)}`;
  const completedThisMonth = goal.progress.filter((day) => day.startsWith(monthPrefix)).length;
  return Math.min(100, Math.round((completedThisMonth / totalDays) * 100));
};