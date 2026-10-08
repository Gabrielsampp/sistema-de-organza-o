export interface DayCounts {
  tasksDone: number;
  tasksTotal: number;
  habitsDone: number;
  habitsTotal: number;
}

/** Peso igual por item. Sem itens planejados: pct = null (estado vazio, nunca 0% nem 100%). */
export function dayProgress(c: DayCounts): { done: number; total: number; pct: number | null } {
  const done = c.tasksDone + c.habitsDone;
  const total = c.tasksTotal + c.habitsTotal;
  return { done, total, pct: total === 0 ? null : Math.round((done / total) * 100) };
}
