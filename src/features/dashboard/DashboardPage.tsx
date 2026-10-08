import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { Card, Label, ProgressBar, ProgressRing } from "@/components/ui";
import { calcStreaks, isScheduled } from "@/features/habits/domain";
import { listCompletions, listHabits } from "@/features/habits/repository";
import { filterByView, isOverdue, sortTasks } from "@/features/tasks/domain";
import { listTasks } from "@/features/tasks/repository";
import { formatLongDate, greeting, todayISO } from "@/lib/dates";
import { getProfileName } from "@/features/settings/repository";
import { useUi } from "@/stores/ui";
import { dayProgress } from "./progress";

export function DashboardPage() {
  const today = todayISO();
  const navigate = useUi((s) => s.navigate);
  const openTask = useUi((s) => s.openTask);
  const tasks = useQuery({ queryKey: ["tasks"], queryFn: listTasks });
  const habits = useQuery({ queryKey: ["habits"], queryFn: listHabits });
  const comps = useQuery({ queryKey: ["completions"], queryFn: listCompletions });
  const name = useQuery({ queryKey: ["profile-name"], queryFn: getProfileName });

  const todayTasks = filterByView(tasks.data ?? [], "today", today);
  const overdue = (tasks.data ?? []).filter((t) => isOverdue(t, today));
  const doneDates = (id: string) => new Set((comps.data ?? []).filter((c) => c.habit_id === id).map((c) => c.date));
  const schedHabits = (habits.data ?? []).filter((h) => isScheduled(h.weekdays_mask, today) && h.start_date <= today);
  const habitsDone = schedHabits.filter((h) => doneDates(h.id).has(today)).length;

  const prog = dayProgress({
    tasksDone: todayTasks.filter((t) => t.status === "done").length,
    tasksTotal: todayTasks.length,
    habitsDone,
    habitsTotal: schedHabits.length,
  });
  const upcoming = sortTasks(todayTasks).filter((t) => t.status !== "done").slice(0, 6);
  const bestStreak = Math.max(0, ...(habits.data ?? []).map((h) => calcStreaks(doneDates(h.id), h.weekdays_mask, h.start_date, today).current));

  return (
    <div className="mx-auto max-w-[1100px] px-10 py-8">
      <h1 className="text-[28px] font-semibold tracking-tight">
        {greeting()}{name.data ? `, ${name.data}` : ""}
      </h1>
      <p className="mb-8 mt-1 text-fg2">{formatLongDate()}</p>

      <div className="grid grid-cols-3 gap-4">
        <Card className="col-span-1 flex items-center gap-6">
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
                <div className="tnum absolute inset-0 flex items-center justify-center text-[24px] font-semibold">{prog.pct}%</div>
              </div>
              <div>
                <Label>Progresso hoje</Label>
                <div className="tnum text-fg2">{prog.done} de {prog.total} itens</div>
              </div>
            </>
          )}
        </Card>

        <Card>
          <Label>Tarefas de hoje</Label>
          <div className="tnum text-[28px] font-semibold">
            {todayTasks.filter((t) => t.status === "done").length}
            <span className="text-[16px] text-muted"> / {todayTasks.length}</span>
          </div>
          <div className="mt-3"><ProgressBar pct={todayTasks.length ? (todayTasks.filter((t) => t.status === "done").length / todayTasks.length) * 100 : 0} /></div>
        </Card>

        <Card>
          <Label>Hábitos de hoje</Label>
          <div className="tnum text-[28px] font-semibold">
            {habitsDone}<span className="text-[16px] text-muted"> / {schedHabits.length}</span>
          </div>
          <div className="mt-3"><ProgressBar tone="success" pct={schedHabits.length ? (habitsDone / schedHabits.length) * 100 : 0} /></div>
          {bestStreak > 0 && <div className="tnum mt-2 text-[12px] text-muted">Maior sequência ativa: {bestStreak} dias</div>}
        </Card>

        <Card className="col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <Label>Próximas de hoje</Label>
            <button onClick={() => navigate("tasks")} className="text-[12px] text-accent hover:text-accent-hover">Ver todas</button>
          </div>
          {upcoming.length === 0 ? (
            <div className="py-4 text-muted">Nenhuma tarefa pendente para hoje.</div>
          ) : (
            <ul className="space-y-1">
              {upcoming.map((t) => (
                <li key={t.id}>
                  <button onClick={() => { navigate("tasks"); openTask(t.id); }} className="flex w-full items-center gap-3 rounded-control px-2 py-1.5 text-left hover:bg-elevated">
                    <span className="size-1.5 rounded-full bg-accent" />
                    <span className="flex-1 truncate">{t.title}</span>
                    {t.due_time && <span className="tnum text-[12px] text-muted">{t.due_time}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <Label>Atrasadas</Label>
          {overdue.length === 0 ? (
            <div className="text-success">Tudo em dia.</div>
          ) : (
            <button onClick={() => navigate("tasks")} className="flex items-center gap-2 text-danger">
              <AlertTriangle size={16} />
              <span className="tnum text-[28px] font-semibold">{overdue.length}</span>
            </button>
          )}
        </Card>
      </div>
    </div>
  );
}
