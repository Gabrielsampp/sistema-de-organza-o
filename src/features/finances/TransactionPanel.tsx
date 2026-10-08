import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, Drawer, Field, Input, Segmented, Select } from "@/components/ui";
import { todayISO } from "@/lib/dates";
import { centsToInput, parseBRL } from "@/lib/money";
import { useUi } from "@/stores/ui";
import type { TxKind } from "./domain";
import { createRecurring, createTransaction, deleteTransaction, listAccounts, listCategories, listTransactions, updateTransaction } from "./repository";
import { runRecurring } from "./service";

interface Draft { kind: TxKind; amount: string; date: string; category_id: string; account_id: string; to_account_id: string; description: string; monthly: boolean }
const blank = (account: string): Draft => ({ kind: "expense", amount: "", date: todayISO(), category_id: "", account_id: account, to_account_id: "", description: "", monthly: false });

export function TransactionPanel() {
  const id = useUi((s) => s.openTxId);
  const close = () => useUi.getState().openTx(null);
  const qc = useQueryClient();
  const accounts = useQuery({ queryKey: ["accounts"], queryFn: listAccounts });
  const cats = useQuery({ queryKey: ["fcats"], queryFn: listCategories });
  const txs = useQuery({ queryKey: ["txs"], queryFn: listTransactions });
  const [d, setD] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);

  const editing = id && id !== "new" ? txs.data?.find((t) => t.id === id) : undefined;
  useEffect(() => {
    setError(null);
    if (!id || !accounts.data) return setD(null);
    if (id === "new") return setD(blank(accounts.data[0]?.id ?? ""));
    if (editing)
      setD({ kind: editing.kind, amount: centsToInput(editing.amount_cents), date: editing.occurred_on, category_id: editing.category_id ?? "",
        account_id: editing.account_id, to_account_id: editing.to_account_id ?? "", description: editing.description, monthly: false });
  }, [id, accounts.data, editing?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = useMutation({
    mutationFn: async () => {
      if (!d) return;
      const cents = parseBRL(d.amount);
      if (!cents || cents <= 0) throw new Error("Valor inválido. Use o formato 1.234,56.");
      if (!d.account_id) throw new Error("Selecione uma conta.");
      if (d.kind === "transfer" && (!d.to_account_id || d.to_account_id === d.account_id)) throw new Error("Escolha uma conta de destino diferente da origem.");
      const input = {
        kind: d.kind, account_id: d.account_id, to_account_id: d.kind === "transfer" ? d.to_account_id : null,
        category_id: d.kind === "transfer" ? null : d.category_id || null, amount_cents: cents, occurred_on: d.date, description: d.description,
      };
      if (editing) return updateTransaction(editing.id, input);
      if (d.monthly && d.kind !== "transfer") {
        const day = Math.min(28, Number(d.date.slice(8)));
        await createRecurring({ account_id: input.account_id, category_id: input.category_id, kind: d.kind, amount_cents: cents, description: d.description, day_of_month: day, start_date: d.date });
        return runRecurring(); // gera a ocorrência do mês de início (e não duplica com lançamento manual)
      }
      return createTransaction(input);
    },
    onSuccess: () => { qc.invalidateQueries(); close(); },
    onError: (e) => setError(e instanceof Error ? e.message : String(e)),
  });
  const del = useMutation({ mutationFn: () => deleteTransaction(editing!.id), onSuccess: () => { qc.invalidateQueries(); close(); } });

  const kindCats = (cats.data ?? []).filter((c) => c.kind === (d?.kind === "income" ? "income" : "expense"));

  return (
    <Drawer open={!!id && !!d} onClose={close} title={editing ? "Editar transação" : "Nova transação"}>
      {d && (
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
          <Segmented<TxKind> value={d.kind} onChange={(kind) => setD({ ...d, kind, category_id: "" })}
            options={[{ value: "expense", label: "Saída", tone: "danger" }, { value: "income", label: "Entrada" }, { value: "transfer", label: "Transferência" }]} />
          <Field label="Valor (R$)">
            <Input autoFocus inputMode="decimal" placeholder="0,00" value={d.amount} onChange={(e) => setD({ ...d, amount: e.target.value })} className="h-11 text-[18px] font-semibold" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Data"><Input type="date" value={d.date} onChange={(e) => setD({ ...d, date: e.target.value })} /></Field>
            {d.kind !== "transfer" && (
              <Field label="Categoria">
                <Select value={d.category_id} onChange={(e) => setD({ ...d, category_id: e.target.value })}>
                  <option value="">Sem categoria</option>
                  {kindCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              </Field>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={d.kind === "transfer" ? "De" : "Conta"}>
              <Select value={d.account_id} onChange={(e) => setD({ ...d, account_id: e.target.value })}>
                {(accounts.data ?? []).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </Select>
            </Field>
            {d.kind === "transfer" && (
              <Field label="Para">
                <Select value={d.to_account_id} onChange={(e) => setD({ ...d, to_account_id: e.target.value })}>
                  <option value="">Selecione…</option>
                  {(accounts.data ?? []).filter((a) => a.id !== d.account_id).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </Select>
              </Field>
            )}
          </div>
          <Field label="Descrição"><Input value={d.description} onChange={(e) => setD({ ...d, description: e.target.value })} placeholder="Ex.: Mercado" /></Field>
          {!editing && d.kind !== "transfer" && (
            <label className="flex items-center gap-2 text-[13px] text-fg2">
              <input type="checkbox" checked={d.monthly} onChange={(e) => setD({ ...d, monthly: e.target.checked })} className="accent-[#22a847]" />
              Repetir todo mês (dia {Math.min(28, Number(d.date.slice(8)) || 1)})
            </label>
          )}
          {error && <p className="text-[12px] text-danger">{error}</p>}
          <div className="flex justify-between border-t border-line pt-4">
            {editing ? <Button type="button" variant="danger" onClick={() => del.mutate()}><Trash2 size={14} /> Excluir</Button> : <span />}
            <Button type="submit" variant="primary" disabled={save.isPending}>Salvar</Button>
          </div>
        </form>
      )}
    </Drawer>
  );
}
