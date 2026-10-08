import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { AreaTrend, Bars, Donut } from "@/components/charts";
import { Card, Checkbox, Label, ProgressBar, ProgressRing } from "@/components/ui";
import { expensesByCategory, monthOf, monthSummary } from "@/features/finances/domain";
import { listCategories, listTransactions } from "@/features/finances/repository";
import { formatBRL } from "@/lib/money";
import { calcStreaks, dailyHabitRate, isScheduled } from "@/features/habits/domain";
import { listCompletions, listHabits } from "@/features/habits/repository";
import { getProfileName } from "@/features/settings/repository";
import { filterByView, isOverdue, sortTasks } from "@/features/tasks/domain";
import { listTasks } from "@/features/tasks/repository";
import { setTaskStatus } from "@/features/tasks/service";
import type { Task } from "@/features/tasks/domain";
import { addDays, formatLongDate, greeting, todayISO } from "@/lib/dates";
import { useUi } from "@/stores/ui";
import { dayProgress } from "./progress";
import { activityByDay } from "./stats";

export function DashboardPage() {
  const qc = useQueryClient();
  const today = todayISO();
  const navigate = useUi((s) => s.navigate);
  const openTask = useUi((s) => s.openTask);
  const tasks = useQuery({ queryKey: ["tasks"], queryFn: listTasks });
  const habits = useQuery({ queryKey: ["habits"], queryFn: listHabits });
  const comps = useQuery({ queryKey: ["completions"], queryFn: listCompletions });
  const name = useQuery({ queryKey: ["profile-name"], queryFn: getProfileName });
  const txs = useQuery({ queryKey: ["txs"], queryFn: listTransactions });
  const fcats = useQuery({ queryKey: ["fcats"], queryFn: listCategories });
  const toggle = useMutation({
    mutationFn: ({ t, done }: { t: Task; done: boolean }) => setTaskStatus(t, done ? "done" : "pending"),
    onSuccess: () => qc.invalidateQueries(),
  });

  const todayTasks = filterByView(tasks.data ?? [], "today", today);
  const tasksDone = todayTasks.filter((t) => t.status === "done").length;
  const overdue = (tasks.data ?? []).filter((t) => isOverdue(t, today));
  const doneDates = (id: string) => new Set((comps.data ?? []).filter((c) => c.habit_id === id).map((c) => c.date));
  const schedHabits = (habits.data ?? []).filter((h) => isScheduled(h.weekdays_mask, today) && h.start_date <= today);
  const habitsDone = schedHabits.filter((h) => doneDates(h.id).has(today)).length;
  const prog = dayProgress({ tasksDone, tasksTotal: todayTasks.length, habitsDone, habitsTotal: schedHabits.length });
  const open = sortTasks(todayTasks).filter((t) => t.status !== "done");
  const last7 = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
  const bestStreak = Math.max(0, ...(habits.data ?? []).map((h) => calcStreaks(doneDates(h.id), h.weekdays_mask, h.start_date, today).current));
  const last14 = Array.from({ length: 14 }, (_, i) => addDays(today, i - 13));
  const activity = activityByDay(tasks.data ?? [], comps.data ?? [], last14);
  const byHabitMap = new Map<string, Set<string>>();
  for (const c of comps.data ?? []) byHabitMap.set(c.habit_id, (byHabitMap.get(c.habit_id) ?? new Set()).add(c.date));
  const last30 = Array.from({ length: 30 }, (_, i) => addDays(today, i - 29));
  const rates = dailyHabitRate(habits.data ?? [], byHabitMap, last30);
  const habitTrend = last30.map((d, i) => ({ day: d.slice(8), rate: rates[i] ?? 0 }));
  const ym = monthOf(today);
  const fin = monthSummary(txs.data ?? [], ym);
  const topCats = expensesByCategory(txs.data ?? [], fcats.data ?? [], ym);
  const initial = (name.data?.trim()[0] ?? "A").toUpperCase();

  return (
    <div className="mx-auto max-w-[1100px] px-10 py-8">
      <header className="mb-8 flex flex-col items-center text-center">
        <div className="mb-4 flex size-24 items-center justify-center rounded-2xl border border-accent/50 bg-surface font-display text-[44px] font-bold text-accent shadow-[0_0_32px_rgba(34,168,71,0.35)]">
          {initial}
        </div>
        <div className="text-[11px] uppercase tracking-wider text-muted">{greeting()}</div>
        <h1 className="font-display text-[26px] font-bold uppercase tracking-wide">{name.data || "Bem-vindo"}</h1>
        <p className="text-[12px] text-muted">{formatLongDate()}</p>
      </header>

      <div className="grid grid-cols-4 gap-4">
        <Card className="col-span-2 flex items-center gap-6 border-accent/20 bg-accent/[0.04]">
          {prog.pct === null ? (
            <div>
              <Label>Progresso hoje</Label>
              <div className="text-fg2">Nada planejado hoje.</div>
              <div className="mt-1 text-[12px] text-muted">Crie uma tarefa para hoje ou um hábito.</div>
            </div>
          ) : (
            <>
              <div className="relative">
                <ProgressRing pct={prog.pct} />
                <div className="tnum absolute inset-0 flex items-center justify-center font-display text-[26px] font-bold">{prog.pct}%</div>
              </div>
              <div>
                <Label>Progresso hoje</Label>
                <div className="tnum text-fg2">{prog.done} de {prog.total} itens</div>
              </div>
            </>
          )}
        </Card>

        <Card>
          <Label>Tarefas</Label>
          <div className="tnum font-display text-[30px] font-bold">{tasksDone}<span className="text-[16px] text-muted"> / {todayTasks.length}</span></div>
          <div className="mt-3"><ProgressBar pct={todayTasks.length ? (tasksDone / todayTasks.length) * 100 : 0} /></div>
        </Card>

        <Card className={overdue.length ? "border-danger/30 bg-danger/[0.05]" : ""}>
          <Label>Atrasadas</Label>
          {overdue.length === 0 ? (
            <div className="text-success">Tudo em dia.</div>
          ) : (
            <button onClick={() => navigate("tasks")} className="flex items-center gap-2 text-danger">
              <AlertTriangle size={16} />
              <span className="tnum font-display text-[30px] font-bold">{overdue.length}</span>
            </button>
          )}
        </Card>

        <Card className="col-span-4">
          <div className="mb-3 flex items-center justify-between">
            <Label>Resumo do dia</Label>
            <button onClick={() => navigate("tasks")} className="text-[12px] text-accent hover:text-accent-hover">Ver tarefas</button>
          </div>
          {open.length === 0 ? (
            <div className="py-3 text-muted">Nenhuma tarefa pendente para hoje.</div>
          ) : (
            <ul className="space-y-1.5">
              {open.slice(0, 4).map((t) => (
                <li key={t.id} className="flex items-center gap-3 rounded-control bg-elevated/60 px-3 py-2.5">
                  <Checkbox round checked={false} label={`Concluir ${t.title}`} onChange={() => toggle.mutate({ t, done: true })} />
                  <button onClick={() => { navigate("tasks"); openTask(t.id); }} className="flex-1 truncate text-left">{t.title}</button>
                  {t.due_time && <span className="tnum text-[12px] text-muted">{t.due_time}</span>}
                </li>
              ))}
            </ul>
          )}
          {open.length > 4 && <div className="mt-3 text-center text-[11px] text-muted">+{open.length - 4} tarefas</div>}
        </Card>

        <Card className="col-span-2">
          <Label>Atividade — 14 dias</Label>
          <Bars data={activity} xKey="day" height={200} series={[{ key: "tasks", name: "Tarefas concluídas", color: "#2cc556" }, { key: "habits", name: "Hábitos marcados", color: "#4c8dff" }]} />
          <div className="mt-2 flex gap-4 text-[11px] text-muted"><span><span className="mr-1 inline-block size-2 rounded-full bg-[#2cc556]" />Tarefas</span><span><span className="mr-1 inline-block size-2 rounded-full bg-[#4c8dff]" />Hábitos</span></div>
        </Card>
        <Card className="col-span-2">
          <Label>Conclusão de hábitos — 30 dias</Label>
          {(habits.data ?? []).length === 0 ? <div className="py-10 text-center text-muted">Crie hábitos para ver a evolução.</div> :
            <AreaTrend data={habitTrend} xKey="day" height={200} format={(v) => `${v}%`} series={[{ key: "rate", name: "Conclusão", color: "#2cc556" }]} />}
        </Card>

        <Card className="col-span-4">
          <div className="mb-3 flex items-center justify-between">
            <Label>Finanças do mês</Label>
            <button onClick={() => navigate("finances")} className="text-[12px] text-accent hover:text-accent-hover">Abrir financeiro</button>
          </div>
          <div className="grid grid-cols-[1fr_1fr_1fr_220px] items-center gap-6">
            <div><div className="tnum font-display text-[24px] font-bold text-success">{formatBRL(fin.income)}</div><div className="text-[11px] uppercase tracking-wider text-muted">Entradas</div></div>
            <div><div className="tnum font-display text-[24px] font-bold text-danger">{formatBRL(fin.expense)}</div><div className="text-[11px] uppercase tracking-wider text-muted">Saídas</div></div>
            <div><div className={`tnum font-display text-[24px] font-bold ${fin.net >= 0 ? "text-success" : "text-danger"}`}>{formatBRL(fin.net)}</div><div className="text-[11px] uppercase tracking-wider text-muted">Resultado</div></div>
            <div className="h-[110px]">{topCats.length === 0 ? <div className="pt-10 text-center text-[12px] text-muted">Sem saídas no mês</div> : <Donut height={110} format={formatBRL} data={topCats.map((c) => ({ name: c.name, value: c.cents, color: c.color }))} />}</div>
          </div>
        </Card>

        <Card className="col-span-4">
          <div className="mb-4 flex items-center justify-between">
            <Label>Hábitos — últimos 7 dias</Label>
            {bestStreak > 0 && <span className="tnum text-[12px] text-muted">Maior sequência ativa: {bestStreak} dias</span>}
          </div>
          {(habits.data ?? []).length === 0 ? (
            <div className="text-muted">Nenhum hábito cadastrado.</div>
          ) : (
            <ul className="space-y-2.5">
              {(habits.data ?? []).map((h) => {
                const done = doneDates(h.id);
                return (
                  <li key={h.id} className="flex items-center gap-4">
                    <span className="w-64 truncate">{h.name}</span>
                    <div className="flex gap-1.5">
                      {last7.map((d) => (
                        <span key={d} title={d} className={`size-[18px] rounded-[5px] border ${done.has(d) ? "border-accent bg-accent" : "border-line-strong"}`} />
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
