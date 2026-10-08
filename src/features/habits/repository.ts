import { execute, nowUTC, select } from "@/db/client";
import { ulid } from "@/lib/ids";
import type { Habit } from "./domain";

export const listHabits = () =>
  select<Habit>(
    `SELECT id,name,description,weekdays_mask,start_date,category,time_of_day FROM habits
     WHERE deleted_at IS NULL AND archived_at IS NULL ORDER BY time_of_day IS NULL, time_of_day, created_at`,
  );

export const listCompletions = () => select<{ habit_id: string; date: string }>("SELECT habit_id,date FROM habit_completions");

export interface HabitInput {
  name: string; description: string; weekdays_mask: number; category: string | null; time_of_day: string | null;
}

export async function createHabit(input: HabitInput & { start_date: string }) {
  const now = nowUTC();
  await execute(
    `INSERT INTO habits (id,name,description,weekdays_mask,start_date,category,time_of_day,created_at,updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8)`,
    [ulid(), input.name.trim(), input.description, input.weekdays_mask, input.start_date, input.category?.trim() || null, input.time_of_day || null, now],
  );
}

export const updateHabit = (id: string, i: HabitInput) =>
  execute(
    `UPDATE habits SET name=$2,description=$3,weekdays_mask=$4,category=$5,time_of_day=$6,updated_at=$7 WHERE id=$1 AND deleted_at IS NULL`,
    [id, i.name.trim(), i.description, i.weekdays_mask, i.category?.trim() || null, i.time_of_day || null, nowUTC()],
  );

export const deleteHabit = (id: string) =>
  execute("UPDATE habits SET deleted_at = $2, updated_at = $2 WHERE id = $1", [id, nowUTC()]);

/** Idempotente e single-statement: sem necessidade de transação. */
export const setCompletion = (habitId: string, date: string, done: boolean) =>
  done
    ? execute("INSERT OR IGNORE INTO habit_completions (id,habit_id,date,created_at) VALUES ($1,$2,$3,$4)", [ulid(), habitId, date, nowUTC()])
    : execute("DELETE FROM habit_completions WHERE habit_id = $1 AND date = $2", [habitId, date]);
