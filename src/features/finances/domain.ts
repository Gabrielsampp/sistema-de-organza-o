import { addMonths } from "@/lib/dates";

export type TxKind = "income" | "expense" | "transfer";
export type AccountType = "checking" | "wallet" | "savings" | "card" | "investment";

export interface Account { id: string; name: string; type: AccountType; initial_balance_cents: number }
export interface Category { id: string; name: string; kind: "income" | "expense"; color: string }
export interface Tx {
  id: string; account_id: string; to_account_id: string | null; category_id: string | null;
  kind: TxKind; amount_cents: number; occurred_on: string; description: string; recurring_id: string | null;
}
export interface Budget { category_id: string; limit_cents: number }
export interface Recurring {
  id: string; account_id: string; category_id: string | null; kind: "income" | "expense";
  amount_cents: number; description: string; day_of_month: number; start_date: string;
}

export const ACCOUNT_LABEL: Record<AccountType, string> = {
  checking: "Conta corrente", wallet: "Carteira", savings: "Poupança", card: "Cartão", investment: "Investimento",
};

export const monthOf = (iso: string) => iso.slice(0, 7); // 'YYYY-MM'
export const shiftMonth = (ym: string, n: number) => monthOf(addMonths(`${ym}-01`, n));
export const monthLabel = (ym: string) => {
  const s = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)) - 1, 1, 12));
  return s.charAt(0).toUpperCase() + s.slice(1);
};
const shortMonth = (ym: string) =>
  new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(new Date(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)) - 1, 1, 12)).replace(".", "");

/** saldo = inicial + receitas − despesas − transferências saídas + transferências entradas */
export function accountBalance(acc: Account, txs: readonly Tx[]): number {
  let b = acc.initial_balance_cents;
  for (const t of txs) {
    if (t.kind === "income" && t.account_id === acc.id) b += t.amount_cents;
    else if (t.kind === "expense" && t.account_id === acc.id) b -= t.amount_cents;
    else if (t.kind === "transfer") {
      if (t.account_id === acc.id) b -= t.amount_cents;
      if (t.to_account_id === acc.id) b += t.amount_cents;
    }
  }
  return b;
}

export interface MonthSummary { income: number; expense: number; net: number; savingsRate: number | null }

/** Transferências não entram: não são receita nem gasto. */
export function monthSummary(txs: readonly Tx[], ym: string): MonthSummary {
  let income = 0;
  let expense = 0;
  for (const t of txs) {
    if (monthOf(t.occurred_on) !== ym) continue;
    if (t.kind === "income") income += t.amount_cents;
    else if (t.kind === "expense") expense += t.amount_cents;
  }
  return { income, expense, net: income - expense, savingsRate: income > 0 ? Math.round(((income - expense) / income) * 100) : null };
}

export function expensesByCategory(txs: readonly Tx[], cats: readonly Category[], ym: string) {
  const sums = new Map<string | null, number>();
  for (const t of txs) {
    if (t.kind !== "expense" || monthOf(t.occurred_on) !== ym) continue;
    sums.set(t.category_id, (sums.get(t.category_id) ?? 0) + t.amount_cents);
  }
  return [...sums.entries()]
    .map(([id, cents]) => {
      const c = cats.find((x) => x.id === id);
      return { id, name: c?.name ?? "Sem categoria", color: c?.color ?? "#6b7280", cents };
    })
    .sort((a, b) => b.cents - a.cents);
}

export function monthlySeries(txs: readonly Tx[], endYm: string, n = 6) {
  return Array.from({ length: n }, (_, i) => {
    const ym = shiftMonth(endYm, i - (n - 1));
    const s = monthSummary(txs, ym);
    return { ym, label: shortMonth(ym), income: s.income, expense: s.expense, net: s.net };
  });
}

export function budgetStatus(spent: number, limit: number) {
  const pct = Math.round((spent / limit) * 100);
  return { pct, tone: pct >= 100 ? ("danger" as const) : pct >= 80 ? ("warning" as const) : ("accent" as const) };
}

/** Datas devidas de um recorrente mensal, do mês de início até hoje (inclusive). Gerador é idempotente por (recurring_id, data). */
export function recurringDates(startDate: string, day: number, today: string): string[] {
  const out: string[] = [];
  const pad = (n: number) => String(n).padStart(2, "0");
  let ym = monthOf(startDate);
  for (let guard = 0; guard < 600; guard++) {
    const d = `${ym}-${pad(day)}`;
    if (d > today) break;
    if (d >= startDate) out.push(d);
    ym = shiftMonth(ym, 1);
  }
  return out;
}
