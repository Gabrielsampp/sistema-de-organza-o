import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Flame, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { EmptyState, Input, Kbd } from "@/components/ui";
import { toISODate, todayISO } from "@/lib/dates";
import { useUi } from "@/stores/ui";
import { ALL_DAYS, WEEKDAY_SHORT, calcStreaks, isScheduled, rateInRange } from "./domain";
import { createHabit, deleteHabit, listCompletions, listHabits, setCompletion } from "./repository";

const monthLabel = (y: number, m: number) =>
  new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date(y, m, 1, 12));
const rateTone = (p: number | null) => (p === null ? "text-faint" : p >= 80 ? "text-success" : p >= 50 ? "text-warning" : "text-danger");

export function HabitsPage() {
  const qc = useQueryClient();
  const today = todayISO();
  const now = new Date();
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [name, setName] = useState("");
  const [mask, setMask] = useState(ALL_DAYS);
  const addRef = useRef<HTMLInputElement>(null);
  const tick = useUi((s) => s.quickAddTick);
  useEffect(() => { if (tick > 0) addRef.current?.focus(); }, [tick]);

  const habits = useQuery({ queryKey: ["habits"], queryFn: listHabits });
  const comps = useQuery({ queryKey: ["completions"], queryFn: listCompletions });

  const byHabit = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const c of comps.data ?? []) {
      if (!m.has(c.habit_id)) m.set(c.habit_id, new Set());
      m.get(c.habit_id)!.add(c.date);
    }
    return m;
  }, [comps.data]);

  const days = useMemo(() => {
    const n = new Date(ym.y, ym.m + 1, 0).getDate();
    return Array.from({ length: n }, (_, i) => toISODate(new Date(ym.y, ym.m, i + 1, 12)));
  }, [ym]);
  const first = days[0]!;
  const last = days[days.length - 1]!;

  const shift = (delta: number) => setYm(({ y, m }) => { const d = new Date(y, m + delta, 1); return { y: d.getFullYear(), m: d.getMonth() }; });

  const add = useMutation({
    mutationFn: () => createHabit({ name, weekdays_mask: mask, start_date: today }),
    onSuccess: () => { setName(""); setMask(ALL_DAYS); qc.invalidateQueries(); },
  });
  const toggle = useMutation({
    mutationFn: ({ id, date, done }: { id: string; date: string; done: boolean }) => setCompletion(id, date, done),
    onSuccess: () => qc.invalidateQueries(),
  });
  const del = useMutation({ mutationFn: (id: string) => deleteHabit(id), onSuccess: () => qc.invalidateQueries() });

  return (
    <div className="px-10 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-[28px] font-bold uppercase tracking-wide">Hábitos</h1>
        <div className="flex items-center gap-3">
          <button aria-label="Mês anterior" onClick={() => shift(-1)} className="rounded p-1.5 text-muted hover:bg-elevated hover:text-fg"><ChevronLeft size={16} /></button>
          <span className="w-40 text-center font-display text-[14px] font-semibold uppercase tracking-wide">{monthLabel(ym.y, ym.m)}</span>
          <button aria-label="Próximo mês" onClick={() => shift(1)} className="rounded p-1.5 text-muted hover:bg-elevated hover:text-fg"><ChevronRight size={16} /></button>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); if (name.trim()) add.mutate(); }} className="mb-6 flex max-w-[760px] items-center gap-3">
        <Input ref={addRef} value={name} onChange={(e) => setName(e.target.value)} placeholder="Novo hábito — Enter para adicionar" className="h-10 text-[14px]" />
        <div className="flex gap-1" role="group" aria-label="Dias da semana">
          {WEEKDAY_SHORT.map((l, i) => {
            const on = (mask & (1 << i)) !== 0;
            return (
              <button type="button" key={i} aria-pressed={on} onClick={() => setMask((m) => (m ^ (1 << i)) || m)}
                className={`size-8 rounded-control text-[12px] ${on ? "bg-accent/15 text-accent" : "text-muted hover:bg-elevated"}`}>
                {l}
              </button>
            );
          })}
        </div>
        <Kbd>Ctrl+N</Kbd>
      </form>

      <div className="overflow-x-auto rounded-card border border-line bg-surface">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-[11px] text-muted">
              <th className="sticky left-0 z-10 w-[280px] min-w-[280px] bg-surface px-5 py-3 text-left font-normal">Hábito</th>
              {days.map((d) => (
                <th key={d} className={`tnum w-8 min-w-8 px-0 py-3 text-center font-normal ${d === today ? "text-accent" : ""}`}>{Number(d.slice(8))}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(habits.data ?? []).map((h) => {
              const done = byHabit.get(h.id) ?? new Set<string>();
              const rate = rateInRange(done, h.weekdays_mask, h.start_date, first, last < today ? last : today);
              const s = calcStreaks(done, h.weekdays_mask, h.start_date, today);
              return (
                <tr key={h.id} className="group border-t border-line">
                  <td className="sticky left-0 z-10 bg-surface px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="flex-1 truncate text-[13px] font-medium">{h.name}</span>
                      <span className="tnum flex items-center gap-1 text-[12px] text-warning" title="Sequência atual"><Flame size={12} />{s.current}</span>
                      <button aria-label={`Excluir ${h.name}`} onClick={() => { if (confirm(`Excluir "${h.name}"?`)) del.mutate(h.id); }}
                        className="text-faint opacity-0 hover:text-danger group-hover:opacity-100"><Trash2 size={13} /></button>
                    </div>
                    <div className={`tnum text-[11px] font-medium ${rateTone(rate)}`}>{rate === null ? "—" : `${rate}%`} <span className="text-faint">· melhor {s.best}</span></div>
                  </td>
                  {days.map((d) => {
                    const sched = isScheduled(h.weekdays_mask, d);
                    const locked = d > today || d < h.start_date || !sched;
                    const checked = done.has(d);
                    return (
                      <td key={d} className="px-0 py-2 text-center">
                        <button
                          role="checkbox"
                          aria-checked={checked}
                          aria-label={`${h.name} em ${d}`}
                          disabled={locked}
                          onClick={() => toggle.mutate({ id: h.id, date: d, done: !checked })}
                          className={`size-[22px] rounded-[6px] border transition-colors disabled:cursor-default ${
                            checked ? "border-accent bg-accent" : locked ? "border-line bg-transparent opacity-40" : "border-line-strong hover:border-accent"
                          } ${d === today && !checked ? "border-accent/60" : ""}`}
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
        {habits.data?.length === 0 && <EmptyState title="Nenhum hábito ainda" hint="Crie o primeiro acima e marque todo dia." />}
      </div>
    </div>
  );
}
