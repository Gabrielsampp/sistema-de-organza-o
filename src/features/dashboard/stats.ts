import { localDateOf } from "@/lib/dates";

/** Tarefas concluídas e hábitos marcados por dia ("estou produzindo mais?"). */
export function activityByDay(
  tasks: readonly { completed_at: string | null }[],
  completions: readonly { date: string }[],
  days: readonly string[],
) {
  const t = new Map<string, number>();
  for (const x of tasks) if (x.completed_at) { const d = localDateOf(x.completed_at); t.set(d, (t.get(d) ?? 0) + 1); }
  const h = new Map<string, number>();
  for (const c of completions) h.set(c.date, (h.get(c.date) ?? 0) + 1);
  return days.map((d) => ({ day: d.slice(8), tasks: t.get(d) ?? 0, habits: h.get(d) ?? 0 }));
}
