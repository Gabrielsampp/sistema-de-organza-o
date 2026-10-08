import { execute, nowUTC, select } from "@/db/client";
import { ulid } from "@/lib/ids";
import type { Habit } from "./domain";

export const listHabits = () =>
  select<Habit>(
    `SELECT id,name,description,weekdays_mask,start_date FROM habits
     WHERE deleted_at IS NULL AND archived_at IS NULL ORDER BY created_at`,
  );

export const listCompletions = () => select<{ habit_id: string; date: string }>("SELECT habit_id,date FROM habit_completions");

export async function createHabit(input: { name: string; weekdays_mask: number; start_date: string }) {
  const now = nowUTC();
  await execute(
    `INSERT INTO habits (id,name,weekdays_mask,start_date,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$5)`,
    [ulid(), input.name.trim(), input.weekdays_mask, input.start_date, now],
  );
}

export const deleteHabit = (id: string) =>
  execute("UPDATE habits SET deleted_at = $2, updated_at = $2 WHERE id = $1", [id, nowUTC()]);

/** Idempotente e single-statement: sem necessidade de transação. */
export const setCompletion = (habitId: string, date: string, done: boolean) =>
  done
    ? execute("INSERT OR IGNORE INTO habit_completions (id,habit_id,date,created_at) VALUES ($1,$2,$3,$4)", [ulid(), habitId, date, nowUTC()])
    : execute("DELETE FROM habit_completions WHERE habit_id = $1 AND date = $2", [habitId, date]);
