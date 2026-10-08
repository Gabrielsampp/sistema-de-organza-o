import { addDays, weekdayOf } from "@/lib/dates";

export interface Habit {
  id: string;
  name: string;
  description: string;
  weekdays_mask: number; // bit0 = domingo .. bit6 = sábado
  start_date: string;
  category: string | null;
  time_of_day: string | null;
}

export const ALL_DAYS = 127;
export const WEEKDAY_SHORT = ["D", "S", "T", "Q", "Q", "S", "S"] as const;

export const isScheduled = (mask: number, iso: string): boolean => (mask & (1 << weekdayOf(iso))) !== 0;

export interface Streaks {
  current: number;
  best: number;
}

/**
 * Streaks derivados das conclusões. Dias não agendados são ignorados (não quebram nem contam).
 * O dia de hoje ainda pendente não quebra a sequência atual.
 */
export function calcStreaks(done: ReadonlySet<string>, mask: number, startDate: string, today: string): Streaks {
  if (startDate > today) return { current: 0, best: 0 };

  let best = 0;
  let run = 0;
  for (let d = startDate; d <= today; d = addDays(d, 1)) {
    if (!isScheduled(mask, d)) continue;
    if (done.has(d)) {
      run++;
      if (run > best) best = run;
    } else if (d !== today) {
      run = 0;
    }
  }

  let current = 0;
  for (let d = today; d >= startDate; d = addDays(d, -1)) {
    if (!isScheduled(mask, d)) continue;
    if (done.has(d)) current++;
    else if (d === today) continue;
    else break;
  }
  return { current, best: Math.max(best, current) };
}

/** % de dias agendados concluídos nos últimos `days` dias (hoje incluso). null se não houve dia agendado. */
export function completionRate(done: ReadonlySet<string>, mask: number, startDate: string, today: string, days = 30): number | null {
  let scheduled = 0;
  let hit = 0;
  for (let i = 0; i < days; i++) {
    const d = addDays(today, -i);
    if (d < startDate) break;
    if (!isScheduled(mask, d)) continue;
    scheduled++;
    if (done.has(d)) hit++;
  }
  return scheduled === 0 ? null : Math.round((hit / scheduled) * 100);
}

/** % de dias agendados concluídos entre `from` e `to` (inclusive), ignorando dias antes do início. */
export function rateInRange(done: ReadonlySet<string>, mask: number, startDate: string, from: string, to: string): number | null {
  let scheduled = 0;
  let hit = 0;
  for (let d = from < startDate ? startDate : from; d <= to; d = addDays(d, 1)) {
    if (!isScheduled(mask, d)) continue;
    scheduled++;
    if (done.has(d)) hit++;
  }
  return scheduled === 0 ? null : Math.round((hit / scheduled) * 100);
}

/** % de hábitos agendados concluídos por dia ("estou mantendo meus hábitos?"). null = nenhum agendado. */
export function dailyHabitRate(habits: readonly Habit[], doneByHabit: ReadonlyMap<string, ReadonlySet<string>>, days: readonly string[]): (number | null)[] {
  return days.map((d) => {
    const sched = habits.filter((h) => h.start_date <= d && isScheduled(h.weekdays_mask, d));
    if (sched.length === 0) return null;
    return Math.round((sched.filter((h) => doneByHabit.get(h.id)?.has(d)).length / sched.length) * 100);
  });
}
