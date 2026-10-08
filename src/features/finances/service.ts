import { todayISO } from "@/lib/dates";
import { recurringDates } from "./domain";
import { insertGeneratedTx, listRecurring } from "./repository";

/** Roda na abertura do app. Idempotente (índice único recurring_id+data) e recupera meses em que o app ficou fechado. */
export async function runRecurring(): Promise<void> {
  const today = todayISO();
  for (const r of await listRecurring()) {
    for (const d of recurringDates(r.start_date, r.day_of_month, today)) await insertGeneratedTx(r, d);
  }
}
