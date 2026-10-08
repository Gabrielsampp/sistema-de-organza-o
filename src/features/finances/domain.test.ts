import { describe, expect, it } from "vitest";
import { accountBalance, budgetStatus, expensesByCategory, monthSummary, monthlySeries, recurringDates, type Account, type Category, type Tx } from "./domain";

const acc = (id: string, init = 0): Account => ({ id, name: id, type: "checking", initial_balance_cents: init });
const tx = (p: Partial<Tx>): Tx => ({ id: "x", account_id: "a", to_account_id: null, category_id: null, kind: "expense", amount_cents: 100, occurred_on: "2026-10-05", description: "", recurring_id: null, ...p });

describe("accountBalance", () => {
  it("considera receitas, despesas e transferências", () => {
    const txs = [
      tx({ kind: "income", amount_cents: 10000 }),
      tx({ kind: "expense", amount_cents: 2500 }),
      tx({ kind: "transfer", amount_cents: 3000, to_account_id: "b" }),
    ];
    expect(accountBalance(acc("a", 500), txs)).toBe(500 + 10000 - 2500 - 3000);
    expect(accountBalance(acc("b"), txs)).toBe(3000);
  });
});

describe("monthSummary", () => {
  const txs = [
    tx({ kind: "income", amount_cents: 100000 }),
    tx({ kind: "expense", amount_cents: 40000 }),
    tx({ kind: "transfer", amount_cents: 99999, to_account_id: "b" }),
    tx({ kind: "expense", amount_cents: 5000, occurred_on: "2026-09-30" }),
  ];
  it("ignora transferências e outros meses", () => {
    expect(monthSummary(txs, "2026-10")).toEqual({ income: 100000, expense: 40000, net: 60000, savingsRate: 60 });
  });
  it("sem receita → taxa nula", () => {
    expect(monthSummary([tx({})], "2026-10").savingsRate).toBeNull();
  });
});

describe("expensesByCategory", () => {
  const cats: Category[] = [{ id: "c1", name: "Comida", kind: "expense", color: "#f00" }];
  it("agrupa e ordena desc; sem categoria vira 'Sem categoria'", () => {
    const r = expensesByCategory([tx({ category_id: "c1", amount_cents: 300 }), tx({ amount_cents: 500 }), tx({ category_id: "c1", amount_cents: 300 })], cats, "2026-10");
    expect(r.map((x) => [x.name, x.cents])).toEqual([["Comida", 600], ["Sem categoria", 500]]);
  });
});

describe("monthlySeries", () => {
  it("retorna n meses terminando no mês dado, atravessando o ano", () => {
    const s = monthlySeries([tx({ occurred_on: "2026-01-10", amount_cents: 700 })], "2026-02", 3);
    expect(s.map((x) => x.ym)).toEqual(["2025-12", "2026-01", "2026-02"]);
    expect(s[1]!.expense).toBe(700);
  });
});

describe("budgetStatus", () => {
  it("tons por faixa", () => {
    expect(budgetStatus(50, 100).tone).toBe("accent");
    expect(budgetStatus(80, 100).tone).toBe("warning");
    expect(budgetStatus(120, 100)).toEqual({ pct: 120, tone: "danger" });
  });
});

describe("recurringDates", () => {
  it("gera meses perdidos até hoje", () => {
    expect(recurringDates("2026-08-10", 5, "2026-10-08")).toEqual(["2026-09-05", "2026-10-05"]);
  });
  it("não gera datas futuras nem anteriores ao início", () => {
    expect(recurringDates("2026-10-06", 5, "2026-10-08")).toEqual([]);
    expect(recurringDates("2026-10-01", 15, "2026-10-08")).toEqual([]);
  });
});
