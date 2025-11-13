// dsi/src/lib/goals.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export type DOW = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Dom..6=Sáb

export type Reminder = {
  id: string;
  time24h: string;   // 'HH:MM'
  weekdays: DOW[];
};

export type Goal = {
  id: string;
  name: string;
  time?: string; // texto livre (opcional) - migracao de formato antigo usa isto
  targetPerWeek: number; // 1..7
  planWeekdays: DOW[];
  reminders: Reminder[];
  history: string[];     // 'YYYY-MM-DD'
  createdAt: number;
};

export const STORAGE_KEY = 'goals.v2';

// utils de data
export const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`);
export const dateKey = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

export function getWeekStart(d: Date) {
  const res = new Date(d);
  const diff = res.getDay(); // 0..6 (Dom..Sáb)
  res.setDate(res.getDate() - diff);
  res.setHours(0, 0, 0, 0);
  return res;
}
export function rangeDays(start: Date, count: number) {
  const arr: Date[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    arr.push(d);
  }
  return arr;
}
export function monthMatrix(year: number, monthIndex0: number) {
  const first = new Date(year, monthIndex0, 1);
  const start = getWeekStart(first);
  return rangeDays(start, 42); // 6 semanas
}

export async function loadGoals(): Promise<Goal[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw) as Goal[]; } catch { return []; }
}
export async function saveGoals(goals: Goal[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
}

export const weekdayLabels = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

export function doneCountThisWeek(goal: Goal, now = new Date()) {
  const start = getWeekStart(now);
  const keys = new Set(rangeDays(start, 7).map(dateKey));
  return goal.history.filter((d) => keys.has(d)).length;
}

export function nextReminderInstances(
  goal: Goal,
  time?: string,
  horizonDays = 7,
  from = new Date()
) {
  const out: { when: Date; goal: Goal; reminder: Reminder }[] = [];
  const base = new Date(from); base.setSeconds(0, 0);

  for (const r of goal.reminders) {
    const [hh, mm] = r.time24h.split(':').map(Number);
    for (let i = 0; i < horizonDays; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const weekday = d.getDay() as DOW;
      if (r.weekdays.includes(weekday)) {
        d.setHours(hh, mm ?? 0, 0, 0);
        if (d.getTime() >= base.getTime()) {
          out.push({ when: d, goal, reminder: r });
        }
      }
    }
  }
  return out.sort((a, b) => a.when.getTime() - b.when.getTime());
}
