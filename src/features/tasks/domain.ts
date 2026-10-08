export type TaskStatus = "pending" | "in_progress" | "done";

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
