import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Flame, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Card, Checkbox, EmptyState, Input, Kbd } from "@/components/ui";
import { addDays, todayISO, weekdayOf } from "@/lib/dates";
import { useUi } from "@/stores/ui";
import { ALL_DAYS, WEEKDAY_SHORT, calcStreaks, completionRate, isScheduled, type Habit } from "./domain";
import { createHabit, deleteHabit, listCompletions, listHabits, setCompletion } from "./repository";

const WEEKS = 20;

/** Responde: "Estou mantendo este hábito?" — 20 semanas, coluna = semana, linha = dia da semana. */
function Heatmap({ done, habit, today }: { done: Set<string>; habit: Habit; today: string }) {
  const first = addDays(today, -weekdayOf(today) - (WEEKS - 1) * 7); // domingo da primeira coluna
  const cols = Array.from({ length: WEEKS }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(first, w * 7 + d)));
  return (
    <div className="flex gap-[3px]" aria-label="Histórico de conclusão">
      {cols.map((col, i) => (
        <div key={i} className="flex flex-col gap-[3px]">
          {col.map((d) => {
            const future = d > today;
            const hit = done.has(d);
            const sched = isScheduled(habit.weekdays_mask, d) && d >= habit.start_date;
            const cls = future ? "bg-transparent" : hit ? "bg-accent" : sched ? "bg-elevated" : "bg-line/50";
            return <div key={d} title={d} className={`size-[11px] rounded-[3px] ${cls}`} />;
          })}
        </div>
      ))}
    </div>
  );
}

export function HabitsPage() {
  const qc = useQueryClient();
  const today = todayISO();
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

  const add = useMutation({
    mutationFn: () => createHabit({ name, weekdays_mask: mask, start_date: today }),
    onSuccess: () => { setName(""); setMask(ALL_DAYS); qc.invalidateQueries(); },
  });
  const toggle = useMutation({
    mutationFn: ({ id, done }: { id: string; done: boolean }) => setCompletion(id, today, done),
    onSuccess: () => qc.invalidateQueries(),
  });
  const del = useMutation({ mutationFn: (id: string) => deleteHabit(id), onSuccess: () => qc.invalidateQueries() });

  return (
    <div className="mx-auto max-w-[920px] px-10 py-8">
      <h1 className="mb-6 text-[28px] font-semibold tracking-tight">Hábitos</h1>

      <form onSubmit={(e) => { e.preventDefault(); if (name.trim()) add.mutate(); }} className="mb-8 flex items-center gap-3">
        <Input ref={addRef} value={name} onChange={(e) => setName(e.target.value)} placeholder="Novo hábito — Enter para adicionar" className="h-10 text-[14px]" />
        <div className="flex gap-1" role="group" aria-label="Dias da semana">
          {WEEKDAY_SHORT.map((l, i) => {
            const on = (mask & (1 << i)) !== 0;
            return (
              <button
                type="button"
                key={i}
                aria-pressed={on}
                onClick={() => setMask((m) => (m ^ (1 << i)) || m)} // impede máscara vazia
                className={`size-8 rounded-control text-[12px] ${on ? "bg-accent/12 text-accent" : "text-muted hover:bg-elevated"}`}
              >
                {l}
              </button>
            );
          })}
        </div>
        <Kbd>Ctrl+N</Kbd>
      </form>

      <div className="space-y-3">
        {(habits.data ?? []).map((h) => {
          const done = byHabit.get(h.id) ?? new Set<string>();
          const s = calcStreaks(done, h.weekdays_mask, h.start_date, today);
          const rate = completionRate(done, h.weekdays_mask, h.start_date, today);
          const schedToday = isScheduled(h.weekdays_mask, today);
          return (
            <Card key={h.id} className="group">
              <div className="mb-4 flex items-center gap-3">
                <Checkbox checked={done.has(today)} label={`Marcar ${h.name} hoje`} onChange={(v) => toggle.mutate({ id: h.id, done: v })} />
                <div className="flex-1">
                  <div className="text-[14px] font-medium">{h.name}</div>
                  {!schedToday && <div className="text-[11px] text-muted">Não agendado para hoje</div>}
                </div>
                <div className="flex items-center gap-1 text-warning tnum"><Flame size={14} />{s.current}</div>
                <div className="tnum text-[12px] text-muted">melhor {s.best}</div>
                <div className="tnum w-12 text-right text-[12px] text-fg2">{rate === null ? "—" : `${rate}%`}</div>
                <button aria-label={`Excluir ${h.name}`} onClick={() => { if (confirm(`Excluir "${h.name}"?`)) del.mutate(h.id); }} className="text-faint opacity-0 hover:text-danger group-hover:opacity-100">
                  <Trash2 size={14} />
                </button>
              </div>
              <Heatmap done={done} habit={h} today={today} />
            </Card>
          );
        })}
        {habits.data?.length === 0 && <EmptyState title="Nenhum hábito ainda" hint="Crie o primeiro acima e marque todo dia." />}
      </div>
    </div>
  );
}
