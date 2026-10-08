import { addDays, addMonths, toISODate, weekdayOf } from "@/lib/dates";

export type TaskStatus = "pending" | "in_progress" | "done";
export type Recurrence = "daily" | "weekdays" | "weekly" | "monthly";
export const RECURRENCE_LABEL: Record<Recurrence, string> = { daily: "Todo dia", weekdays: "Dias úteis", weekly: "Toda semana", monthly: "Todo mês" };

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 0 | 1 | 2 | 3;
  status: TaskStatus;
  due_date: string | null;
  due_time: string | null;
  completed_at: string | null;
  position: number;
  category: string | null;
  recurrence: Recurrence | null;
  series_id: string | null;
}

export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  done_at: string | null;
  position: number;
}

export const PRIORITY_LABEL = ["Baixa", "Média", "Alta", "Urgente"] as const;
export const STATUS_LABEL: Record<TaskStatus, string> = {
  pending: "Pendente",
  in_progress: "Em andamento",
  done: "Concluída",
};

/** "Atrasada" é derivado, nunca armazenado. */
export function isOverdue(t: Pick<Task, "due_date" | "status">, today: string): boolean {
  return t.status !== "done" && t.due_date !== null && t.due_date < today;
}

export type TaskView = "today" | "upcoming" | "overdue" | "all";

export function filterByView(tasks: Task[], view: TaskView, today: string): Task[] {
  switch (view) {
    case "today":
      return tasks.filter((t) => t.due_date === today);
    case "upcoming":
      return tasks.filter((t) => t.status !== "done" && t.due_date !== null && t.due_date > today);
    case "overdue":
      return tasks.filter((t) => isOverdue(t, today));
    case "all":
      return tasks;
  }
}

/** Abertas primeiro, depois prioridade desc, data, horário, posição. */
export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if ((a.status === "done") !== (b.status === "done")) return a.status === "done" ? 1 : -1;
    if (a.priority !== b.priority) return b.priority - a.priority;
    const da = a.due_date ?? "9999-99-99";
    const db = b.due_date ?? "9999-99-99";
    if (da !== db) return da < db ? -1 : 1;
    const ta = a.due_time ?? "99:99";
    const tb = b.due_time ?? "99:99";
    if (ta !== tb) return ta < tb ? -1 : 1;
    return a.position - b.position;
  });
}

/** Próxima data de uma tarefa recorrente. */
export function nextOccurrence(due: string, r: Recurrence): string {
  switch (r) {
    case "daily": return addDays(due, 1);
    case "weekly": return addDays(due, 7);
    case "monthly": return addMonths(due, 1);
    case "weekdays": {
      let d = addDays(due, 1);
      while (weekdayOf(d) === 0 || weekdayOf(d) === 6) d = addDays(d, 1);
      return d;
    }
  }
}

/** Próxima ocorrência que não caia no passado (tarefa concluída com atraso não gera pendência atrasada). */
export function nextDueFrom(due: string, r: Recurrence, today: string): string {
  let n = nextOccurrence(due, r);
  for (let i = 0; i < 400 && n < today; i++) n = nextOccurrence(n, r);
  return n;
}

/** 42 células (6 semanas, começando no domingo) para o calendário do mês. */
export function monthGrid(y: number, m: number): { date: string; inMonth: boolean }[] {
  const first = new Date(y, m, 1, 12);
  const start = new Date(y, m, 1 - first.getDay(), 12);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i, 12);
    return { date: toISODate(d), inMonth: d.getMonth() === m };
  });
}

/** Cor estável por nome de categoria. */
export function categoryColor(name: string): string {
  const palette = ["#f97316", "#3b82f6", "#eab308", "#14b8a6", "#ec4899", "#8b5cf6", "#06b6d4", "#22c55e"];
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return palette[h % palette.length]!;
}
