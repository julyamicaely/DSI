// src/lib/migrateGoals.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Goal, DOW } from './goals';

type OldGoal = {
  id: string;
  name: string;
  time: string; // texto livre
};

const OLD_KEY = 'goals';      // onde suas metas antigas estão
const NEW_KEY = 'goals.v2';   // novo formato

// tenta mapear dias a partir do texto livre (seg, ter, qua, qui, sex, sab/sáb, dom)
const mapWeekdays = (t: string): DOW[] => {
  const lower = (t || '').toLowerCase();
  const pairs: [string, DOW][] = [
    ['dom', 0], ['seg', 1], ['ter', 2], ['qua', 3], ['qui', 4], ['sex', 5], ['sáb', 6], ['sab', 6],
  ];
  return pairs.filter(([k]) => lower.includes(k)).map(([, v]) => v);
};

export async function migrateOldGoalsToV2(): Promise<{ migrated: number }> {
  const raw = await AsyncStorage.getItem(OLD_KEY);
  if (!raw) return { migrated: 0 };

  let old: OldGoal[] = [];
  try { old = JSON.parse(raw); } catch { return { migrated: 0 }; }
  if (!Array.isArray(old) || old.length === 0) return { migrated: 0 };

  const now = Date.now();

  const converted: Goal[] = old.map((o, idx) => {
    const weekdays = mapWeekdays(o.time);
    const targetPerWeek = weekdays.length > 0 ? weekdays.length : 3;

    // extrai um horário HH:MM se existir; senão, define 07:30
    const timeMatch = o.time?.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
    const hhmm = timeMatch ? timeMatch[0] : '07:30';

    return {
      id: o.id || `${now}_${idx}`,
      name: o.name || 'Meta',
      time: o.time || '',
      targetPerWeek,
      planWeekdays: weekdays.length ? weekdays : [1, 3, 5], // seg/qua/sex se não achar nada
      reminders: [{ id: `r_${idx}`, time24h: hhmm, weekdays: weekdays.length ? weekdays : [1, 3, 5] }],
      history: [],
      createdAt: now + idx,
    };
  });

  await AsyncStorage.setItem(NEW_KEY, JSON.stringify(converted));
  return { migrated: converted.length };
}
