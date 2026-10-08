import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeftRight, ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AreaTrend, Bars, Donut } from "@/components/charts";
import { Badge, Button, Card, EmptyState, Input, Label, ProgressBar, Select, StatCard } from "@/components/ui";
import { formatShort, todayISO } from "@/lib/dates";
import { formatBRL, parseBRL } from "@/lib/money";
import { useUi } from "@/stores/ui";
import {
  ACCOUNT_LABEL, accountBalance, budgetStatus, expensesByCategory, monthLabel, monthOf, monthSummary, monthlySeries, shiftMonth,
  type Account, type AccountType, type Category, type Recurring, type Tx, type TxKind,
} from "./domain";
import { createAccount, deleteAccount, deleteRecurring, listAccounts, listBudgets, listCategories, listRecurring, listTransactions, setBudget } from "./repository";
import { TransactionPanel } from "./TransactionPanel";

type Tab = "overview" | "transactions" | "accounts";
const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Visão geral" }, { id: "transactions", label: "Transações" }, { id: "accounts", label: "Contas e recorrentes" },
];
const C = { income: "#2cc556", expense: "#ef4444", net: "#4c8dff" };

export function FinancesPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("overview");
  const [ym, setYm] = useState(monthOf(todayISO()));
  const openTx = useUi((s) => s.openTx);
  const tick = useUi((s) => s.quickAddTick);
  useEffect(() => { if (tick > 0) openTx("new"); }, [tick, openTx]);

  const accounts = useQuery({ queryKey: ["accounts"], queryFn: listAccounts });
  const cats = useQuery({ queryKey: ["fcats"], queryFn: listCategories });
  const txs = useQuery({ queryKey: ["txs"], queryFn: listTransactions });
  const budgets = useQuery({ queryKey: ["budgets"], queryFn: listBudgets });
  const recurring = useQuery({ queryKey: ["recurring"], queryFn: listRecurring });

  const all = txs.data ?? [];
  const summary = useMemo(() => monthSummary(all, ym), [all, ym]);
  const byCat = useMemo(() => expensesByCategory(all, cats.data ?? [], ym), [all, cats.data, ym]);
  const series = useMemo(() => monthlySeries(all, ym, 6), [all, ym]);
  const totalBalance = (accounts.data ?? []).reduce((s, a) => s + accountBalance(a, all), 0);

  const [filter, setFilter] = useState<"all" | TxKind>("all");
  const [q, setQ] = useState("");
  const catName = (id: string | null) => (cats.data ?? []).find((c) => c.id === id);
  const accName = (id: string | null) => (accounts.data ?? []).find((a) => a.id === id)?.name ?? "—";
  const monthTx = all.filter((t) => monthOf(t.occurred_on) === ym && (filter === "all" || t.kind === filter) &&
    (!q.trim() || `${t.description} ${catName(t.category_id)?.name ?? ""}`.toLowerCase().includes(q.trim().toLowerCase())));

  const budgetMut = useMutation({ mutationFn: ({ id, cents }: { id: string; cents: number | null }) => setBudget(id, cents), onSuccess: () => qc.invalidateQueries() });
  const [editBudget, setEditBudget] = useState<string | null>(null);
  const [budgetDraft, setBudgetDraft] = useState("");

  return (
    <div className="mx-auto max-w-[1200px] px-10 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-[28px] font-bold uppercase tracking-wide">Financeiro</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <button aria-label="Mês anterior" onClick={() => setYm(shiftMonth(ym, -1))} className="rounded p-1.5 text-muted hover:bg-elevated hover:text-fg"><ChevronLeft size={16} /></button>
            <span className="w-36 text-center font-display text-[14px] font-semibold uppercase tracking-wide">{monthLabel(ym)}</span>
            <button aria-label="Próximo mês" onClick={() => setYm(shiftMonth(ym, 1))} className="rounded p-1.5 text-muted hover:bg-elevated hover:text-fg"><ChevronRight size={16} /></button>
          </div>
          <Button variant="primary" onClick={() => openTx("new")}><Plus size={14} /> Nova transação</Button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-4 gap-4">
        <StatCard label="Entradas" value={formatBRL(summary.income)} tone="success" />
        <StatCard label="Saídas" value={formatBRL(summary.expense)} tone="danger" />
        <StatCard label="Resultado do mês" value={formatBRL(summary.net)} tone={summary.net >= 0 ? "success" : "danger"}
          sub={summary.savingsRate === null ? "Sem entradas no mês" : `Economizou ${summary.savingsRate}% da renda`} />
        <StatCard label="Saldo total em contas" value={formatBRL(totalBalance)} />
      </div>

      <div className="mb-6 flex gap-1 border-b border-line">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-4 py-2 text-[13px] ${tab === t.id ? "border-accent text-fg" : "border-transparent text-muted hover:text-fg"}`}>{t.label}</button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <Label>Gastos por categoria</Label>
            {byCat.length === 0 ? <EmptyState title="Sem saídas neste mês" /> : (
              <div className="flex items-center gap-4">
                <div className="w-[200px] shrink-0"><Donut format={formatBRL} data={byCat.map((c) => ({ name: c.name, value: c.cents, color: c.color }))} /></div>
                <ul className="flex-1 space-y-1.5">
                  {byCat.slice(0, 6).map((c) => (
                    <li key={c.id ?? "none"} className="flex items-center gap-2 text-[12px]">
                      <span className="size-2 rounded-full" style={{ background: c.color }} />
                      <span className="flex-1 truncate text-fg2">{c.name}</span>
                      <span className="tnum">{formatBRL(c.cents)}</span>
                      <span className="tnum w-9 text-right text-muted">{Math.round((c.cents / summary.expense) * 100)}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
          <Card>
            <Label>Entradas × saídas — 6 meses</Label>
            <Bars data={series} xKey="label" format={(v) => `${Math.round(v / 100)}`}
              series={[{ key: "income", name: "Entradas", color: C.income }, { key: "expense", name: "Saídas", color: C.expense }]} />
          </Card>
          <Card className="col-span-2">
            <Label>Resultado mensal (entradas − saídas)</Label>
            <AreaTrend data={series} xKey="label" format={(v) => formatBRL(v).replace(",00", "")} height={180}
              series={[{ key: "net", name: "Resultado", color: C.net }]} />
          </Card>
          <Card className="col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <Label>Orçamento por categoria</Label>
              <span className="text-[11px] text-muted">Clique no limite para editar</span>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-5">
              {(cats.data ?? []).filter((c) => c.kind === "expense").map((c) => {
                const spent = byCat.find((b) => b.id === c.id)?.cents ?? 0;
                const limit = budgets.data?.find((b) => b.category_id === c.id)?.limit_cents ?? 0;
                const st = limit ? budgetStatus(spent, limit) : null;
                return (
                  <div key={c.id}>
                    <div className="mb-1.5 flex items-center gap-2 text-[13px]">
                      <span className="size-2 rounded-full" style={{ background: c.color }} />
                      <span className="flex-1">{c.name}</span>
                      <span className="tnum text-fg2">{formatBRL(spent)}</span>
                      <span className="text-faint">/</span>
                      {editBudget === c.id ? (
                        <Input autoFocus value={budgetDraft} onChange={(e) => setBudgetDraft(e.target.value)} className="h-6 w-24 px-2 text-[12px]"
                          onBlur={() => { const v = budgetDraft.trim() ? parseBRL(budgetDraft) : null; if (v !== null || !budgetDraft.trim()) budgetMut.mutate({ id: c.id, cents: v }); setEditBudget(null); }}
                          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()} />
                      ) : (
                        <button onClick={() => { setEditBudget(c.id); setBudgetDraft(limit ? String(limit / 100).replace(".", ",") : ""); }} className="tnum text-muted hover:text-accent">
                          {limit ? formatBRL(limit) : "definir"}
                        </button>
                      )}
                      {st && <span className={`tnum w-10 text-right text-[12px] ${st.tone === "danger" ? "text-danger" : st.tone === "warning" ? "text-warning" : "text-muted"}`}>{st.pct}%</span>}
                    </div>
                    <ProgressBar pct={st?.pct ?? 0} tone={st?.tone === "danger" ? "danger" : "accent"} />
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {tab === "transactions" && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex gap-1">
              {([["all", "Todas"], ["income", "Entradas"], ["expense", "Saídas"], ["transfer", "Transferências"]] as const).map(([k, l]) => (
                <button key={k} onClick={() => setFilter(k)} className={`h-8 rounded-control px-3 text-[13px] ${filter === k ? "bg-accent/15 text-accent" : "text-fg2 hover:bg-elevated"}`}>{l}</button>
              ))}
            </div>
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar…" className="w-56" />
          </div>
          <div className="overflow-hidden rounded-card border border-line bg-surface">
            <table className="w-full text-[13px]">
              <thead className="border-b border-line text-left text-[11px] uppercase tracking-wider text-muted">
                <tr><th className="px-4 py-3 font-normal">Data</th><th className="font-normal">Descrição</th><th className="font-normal">Categoria</th><th className="font-normal">Conta</th><th className="px-4 text-right font-normal">Valor</th></tr>
              </thead>
              <tbody>
                {monthTx.map((t) => {
                  const c = catName(t.category_id);
                  const sign = t.kind === "income" ? "+" : t.kind === "expense" ? "−" : "";
                  return (
                    <tr key={t.id} onClick={() => openTx(t.id)} className="cursor-pointer border-b border-line last:border-0 hover:bg-elevated/60">
                      <td className="tnum px-4 py-3 text-muted">{formatShort(t.occurred_on)}</td>
                      <td>{t.description || <span className="text-faint">—</span>} {t.recurring_id && <Badge>mensal</Badge>}</td>
                      <td>{t.kind === "transfer" ? <span className="flex items-center gap-1 text-muted"><ArrowLeftRight size={12} />Transferência</span> :
                        c ? <span className="flex items-center gap-2"><span className="size-2 rounded-full" style={{ background: c.color }} />{c.name}</span> : <span className="text-faint">Sem categoria</span>}</td>
                      <td className="text-fg2">{accName(t.account_id)}{t.to_account_id ? ` → ${accName(t.to_account_id)}` : ""}</td>
                      <td className={`tnum px-4 text-right font-medium ${t.kind === "income" ? "text-success" : t.kind === "expense" ? "text-danger" : "text-fg2"}`}>{sign} {formatBRL(t.amount_cents)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {monthTx.length === 0 && <EmptyState title="Nenhuma transação" hint="Use “Nova transação” ou Ctrl+N." />}
          </div>
        </div>
      )}

      {tab === "accounts" && <AccountsTab accounts={accounts.data ?? []} txs={all} recurring={recurring.data ?? []} cats={cats.data ?? []} accName={accName} />}
      <TransactionPanel />
    </div>
  );
}

function AccountsTab({ accounts, txs, recurring, cats, accName }: {
  accounts: Account[]; txs: Tx[]; recurring: Recurring[]; cats: Category[]; accName: (id: string | null) => string;
}) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("checking");
  const [initial, setInitial] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const add = useMutation({
    mutationFn: async () => {
      const cents = initial.trim() ? parseBRL(initial.replace("-", "")) : 0;
      if (cents === null) throw new Error("Saldo inicial inválido.");
      await createAccount(name, type, initial.trim().startsWith("-") ? -cents : cents);
    },
    onSuccess: () => { setName(""); setInitial(""); setErr(null); qc.invalidateQueries(); },
    onError: (e) => setErr(String(e instanceof Error ? e.message : e)),
  });
  const rem = useMutation({
    mutationFn: (id: string) => deleteAccount(id),
    onSuccess: (r) => { setErr(r.ok ? null : r.reason ?? "Falha"); qc.invalidateQueries(); },
  });
  const remRec = useMutation({ mutationFn: (id: string) => deleteRecurring(id), onSuccess: () => qc.invalidateQueries() });
  return (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <Label>Contas</Label>
        <ul className="mb-4 divide-y divide-line">
          {accounts.map((a) => (
            <li key={a.id} className="group flex items-center gap-3 py-2.5">
              <div className="flex-1"><div>{a.name}</div><div className="text-[11px] text-muted">{ACCOUNT_LABEL[a.type]}</div></div>
              <span className="tnum font-medium">{formatBRL(accountBalance(a, txs))}</span>
              <button aria-label={`Excluir ${a.name}`} onClick={() => confirm(`Excluir a conta "${a.name}"?`) && rem.mutate(a.id)} className="text-faint opacity-0 hover:text-danger group-hover:opacity-100"><Trash2 size={14} /></button>
            </li>
          ))}
        </ul>
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (name.trim()) add.mutate(); }}>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nova conta" />
          <Select value={type} onChange={(e) => setType(e.target.value as AccountType)} className="w-40">
            {(Object.keys(ACCOUNT_LABEL) as AccountType[]).map((k) => <option key={k} value={k}>{ACCOUNT_LABEL[k]}</option>)}
          </Select>
          <Input value={initial} onChange={(e) => setInitial(e.target.value)} placeholder="Saldo inicial" className="w-32" />
          <Button type="submit" variant="primary" aria-label="Adicionar conta"><Plus size={14} /></Button>
        </form>
        {err && <p className="mt-2 text-[12px] text-danger">{err}</p>}
      </Card>
      <Card>
        <Label>Recorrentes (todo mês)</Label>
        {recurring.length === 0 ? <EmptyState title="Nenhuma recorrência" hint="Na nova transação, marque “Repetir todo mês”." /> : (
          <ul className="divide-y divide-line">
            {recurring.map((r) => {
              const c = cats.find((x) => x.id === r.category_id);
              return (
                <li key={r.id} className="group flex items-center gap-3 py-2.5">
                  <span className="tnum w-10 text-muted">dia {r.day_of_month}</span>
                  <div className="flex-1"><div>{r.description || c?.name || "Sem descrição"}</div><div className="text-[11px] text-muted">{accName(r.account_id)}</div></div>
                  <span className={`tnum font-medium ${r.kind === "income" ? "text-success" : "text-danger"}`}>{r.kind === "income" ? "+" : "−"} {formatBRL(r.amount_cents)}</span>
                  <button aria-label="Remover recorrência" onClick={() => remRec.mutate(r.id)} className="text-faint opacity-0 hover:text-danger group-hover:opacity-100"><Trash2 size={14} /></button>
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-3 text-[11px] text-faint">Remover uma recorrência não apaga lançamentos já gerados.</p>
      </Card>
    </div>
  );
}
