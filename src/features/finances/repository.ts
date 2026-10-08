import { execute, nowUTC, select } from "@/db/client";
import { ulid } from "@/lib/ids";
import type { Account, AccountType, Budget, Category, Recurring, Tx, TxKind } from "./domain";

export const listAccounts = () =>
  select<Account>("SELECT id,name,type,initial_balance_cents FROM finance_accounts WHERE deleted_at IS NULL ORDER BY created_at");
export const listCategories = () =>
  select<Category>("SELECT id,name,kind,color FROM finance_categories WHERE deleted_at IS NULL ORDER BY kind, position");
export const listTransactions = () =>
  select<Tx>(
    `SELECT id,account_id,to_account_id,category_id,kind,amount_cents,occurred_on,description,recurring_id
     FROM finance_transactions WHERE deleted_at IS NULL ORDER BY occurred_on DESC, created_at DESC`,
  );
export const listBudgets = () => select<Budget>("SELECT category_id,limit_cents FROM finance_budgets");
export const listRecurring = () =>
  select<Recurring>(
    `SELECT id,account_id,category_id,kind,amount_cents,description,day_of_month,start_date
     FROM finance_recurring WHERE deleted_at IS NULL ORDER BY day_of_month`,
  );

export interface TxInput {
  kind: TxKind; account_id: string; to_account_id: string | null; category_id: string | null;
  amount_cents: number; occurred_on: string; description: string;
}

export async function createTransaction(i: TxInput) {
  const now = nowUTC();
  await execute(
    `INSERT INTO finance_transactions (id,account_id,to_account_id,category_id,kind,amount_cents,occurred_on,description,created_at,updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$9)`,
    [ulid(), i.account_id, i.to_account_id, i.category_id, i.kind, i.amount_cents, i.occurred_on, i.description.trim(), now],
  );
}

export const updateTransaction = (id: string, i: TxInput) =>
  execute(
    `UPDATE finance_transactions SET account_id=$2,to_account_id=$3,category_id=$4,kind=$5,amount_cents=$6,occurred_on=$7,description=$8,updated_at=$9
     WHERE id=$1 AND deleted_at IS NULL`,
    [id, i.account_id, i.to_account_id, i.category_id, i.kind, i.amount_cents, i.occurred_on, i.description.trim(), nowUTC()],
  );

export const deleteTransaction = (id: string) =>
  execute("UPDATE finance_transactions SET deleted_at=$2, updated_at=$2 WHERE id=$1", [id, nowUTC()]);

/** limit null/0 remove o orçamento. */
export const setBudget = (categoryId: string, limitCents: number | null) =>
  limitCents
    ? execute(
        `INSERT INTO finance_budgets (category_id,limit_cents,updated_at) VALUES ($1,$2,$3)
         ON CONFLICT(category_id) DO UPDATE SET limit_cents=excluded.limit_cents, updated_at=excluded.updated_at`,
        [categoryId, limitCents, nowUTC()],
      )
    : execute("DELETE FROM finance_budgets WHERE category_id=$1", [categoryId]);

export const createAccount = (name: string, type: AccountType, initialCents: number) => {
  const now = nowUTC();
  return execute(
    "INSERT INTO finance_accounts (id,name,type,initial_balance_cents,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$5)",
    [ulid(), name.trim(), type, initialCents, now],
  );
};

export async function deleteAccount(id: string): Promise<{ ok: boolean; reason?: string }> {
  const used = await select<{ n: number }>(
    "SELECT COUNT(*) AS n FROM finance_transactions WHERE deleted_at IS NULL AND (account_id=$1 OR to_account_id=$1)",
    [id],
  );
  if ((used[0]?.n ?? 0) > 0) return { ok: false, reason: "A conta possui transações. Exclua-as ou transfira antes." };
  await execute("UPDATE finance_accounts SET deleted_at=$2, updated_at=$2 WHERE id=$1", [id, nowUTC()]);
  return { ok: true };
}

export const createRecurring = (r: Omit<Recurring, "id">) => {
  const now = nowUTC();
  return execute(
    `INSERT INTO finance_recurring (id,account_id,category_id,kind,amount_cents,description,day_of_month,start_date,created_at,updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$9)`,
    [ulid(), r.account_id, r.category_id, r.kind, r.amount_cents, r.description.trim(), r.day_of_month, r.start_date, now],
  );
};

export const deleteRecurring = (id: string) =>
  execute("UPDATE finance_recurring SET deleted_at=$2, updated_at=$2 WHERE id=$1", [id, nowUTC()]);

export const insertGeneratedTx = (r: Recurring, date: string) => {
  const now = nowUTC();
  return execute(
    `INSERT OR IGNORE INTO finance_transactions (id,account_id,category_id,kind,amount_cents,occurred_on,description,recurring_id,created_at,updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$9)`,
    [ulid(), r.account_id, r.category_id, r.kind, r.amount_cents, date, r.description, r.id, now],
  );
};
