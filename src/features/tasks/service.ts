import { todayISO } from "@/lib/dates";
import { nextDueFrom, type Task, type TaskStatus } from "./domain";
import { insertNextOccurrence, updateTask } from "./repository";

/** Muda o status; ao concluir uma tarefa recorrente, gera a próxima ocorrência (idempotente). */
export async function setTaskStatus(task: Task, status: TaskStatus): Promise<void> {
  const becameDone = status === "done" && task.status !== "done";
  if (becameDone && task.recurrence && task.due_date) {
    const series = task.series_id ?? task.id;
    await updateTask(task.id, { status, series_id: series });
    await insertNextOccurrence({ ...task, series_id: series }, nextDueFrom(task.due_date, task.recurrence, todayISO()));
    return;
  }
  await updateTask(task.id, { status });
}
