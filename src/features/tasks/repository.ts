import { execute, nowUTC, select } from "@/db/client";
import { ulid } from "@/lib/ids";
import type { Subtask, Task, TaskStatus } from "./domain";

const TASK_COLS = "id,title,description,priority,status,due_date,due_time,completed_at,position";

export const listTasks = () =>
  select<Task>(`SELECT ${TASK_COLS} FROM tasks WHERE deleted_at IS NULL ORDER BY created_at DESC`);

export async function createTask(input: { title: string; due_date?: string | null; priority?: number }): Promise<string> {
  const id = ulid();
  const now = nowUTC();
  await execute(
    `INSERT INTO tasks (id,title,priority,due_date,position,created_at,updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$6)`,
    [id, input.title.trim(), input.priority ?? 1, input.due_date ?? null, Date.now(), now],
  );
  return id;
}

export interface TaskPatch {
  title?: string;
  description?: string;
  priority?: number;
  status?: TaskStatus;
  due_date?: string | null;
  due_time?: string | null;
}

const PATCHABLE = new Set(["title", "description", "priority", "status", "due_date", "due_time"]);

/** Única query de UPDATE: colunas vêm de uma allowlist, valores sempre parametrizados. */
export async function updateTask(id: string, patch: TaskPatch): Promise<void> {
  const sets: string[] = [];
  const params: unknown[] = [id];
  for (const [k, v] of Object.entries(patch)) {
    if (!PATCHABLE.has(k) || v === undefined) continue;
    params.push(v);
    sets.push(`${k} = $${params.length}`);
  }
  if (patch.status !== undefined) {
    params.push(patch.status === "done" ? nowUTC() : null);
    sets.push(`completed_at = $${params.length}`);
  }
  if (sets.length === 0) return;
  params.push(nowUTC());
  sets.push(`updated_at = $${params.length}`);
  await execute(`UPDATE tasks SET ${sets.join(", ")} WHERE id = $1 AND deleted_at IS NULL`, params);
}

export const deleteTask = (id: string) =>
  execute("UPDATE tasks SET deleted_at = $2, updated_at = $2 WHERE id = $1", [id, nowUTC()]);

export const listSubtasks = (taskId: string) =>
  select<Subtask>(
    `SELECT id,task_id,title,done_at,position FROM task_subtasks
     WHERE task_id = $1 AND deleted_at IS NULL ORDER BY position`,
    [taskId],
  );

export const addSubtask = (taskId: string, title: string) => {
  const now = nowUTC();
  return execute(
    `INSERT INTO task_subtasks (id,task_id,title,position,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$5)`,
    [ulid(), taskId, title.trim(), Date.now(), now],
  );
};

export const toggleSubtask = (id: string, done: boolean) =>
  execute("UPDATE task_subtasks SET done_at = $2, updated_at = $3 WHERE id = $1", [id, done ? nowUTC() : null, nowUTC()]);

export const deleteSubtask = (id: string) =>
  execute("UPDATE task_subtasks SET deleted_at = $2, updated_at = $2 WHERE id = $1", [id, nowUTC()]);
