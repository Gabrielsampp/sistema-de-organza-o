import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Badge, Checkbox, EmptyState, Input, Kbd } from "@/components/ui";
import { formatShort, todayISO } from "@/lib/dates";
import { useUi } from "@/stores/ui";
import { PRIORITY_LABEL, filterByView, isOverdue, sortTasks, type TaskView } from "./domain";
import { TaskPanel } from "./TaskPanel";
import { createTask, listTasks, updateTask } from "./repository";

const VIEWS: { id: TaskView; label: string }[] = [
  { id: "today", label: "Hoje" },
  { id: "upcoming", label: "Próximas" },
  { id: "overdue", label: "Atrasadas" },
  { id: "all", label: "Todas" },
];
const PRIORITY_TONE = ["neutral", "accent", "warning", "danger"] as const;
const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export function TasksPage() {
  const qc = useQueryClient();
  const [view, setView] = useState<TaskView>("today");
  const [search, setSearch] = useState("");
  const [title, setTitle] = useState("");
  const addRef = useRef<HTMLInputElement>(null);
  const openTask = useUi((s) => s.openTask);
  const tick = useUi((s) => s.quickAddTick);
  const today = todayISO();

  const { data = [], error } = useQuery({ queryKey: ["tasks"], queryFn: listTasks });
  useEffect(() => { if (tick > 0) addRef.current?.focus(); }, [tick]);

  const add = useMutation({
    mutationFn: () => createTask({ title, due_date: view === "today" ? today : null }),
    onSuccess: () => { setTitle(""); qc.invalidateQueries(); },
  });
  const toggle = useMutation({
    mutationFn: ({ id, done }: { id: string; done: boolean }) => updateTask(id, { status: done ? "done" : "pending" }),
    onSuccess: () => qc.invalidateQueries(),
  });

  const counts = useMemo(
    () => Object.fromEntries(VIEWS.map((v) => [v.id, filterByView(data, v.id, today).filter((t) => v.id === "all" || v.id === "today" || t.status !== "done").length])) as Record<TaskView, number>,
    [data, today],
  );
  const visible = useMemo(() => {
    const nq = norm(search.trim());
    const list = filterByView(data, view, today).filter((t) => !nq || norm(t.title).includes(nq));
    return sortTasks(list);
  }, [data, view, today, search]);

  return (
    <div className="mx-auto max-w-[920px] px-10 py-8">
      <h1 className="mb-6 text-[28px] font-semibold tracking-tight">Tarefas</h1>

      <form
        onSubmit={(e) => { e.preventDefault(); if (title.trim()) add.mutate(); }}
        className="mb-6 flex items-center gap-3"
      >
        <Input ref={addRef} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={view === "today" ? "Nova tarefa para hoje — Enter para adicionar" : "Nova tarefa — Enter para adicionar"} className="h-10 text-[14px]" />
        <Kbd>Ctrl+N</Kbd>
      </form>

      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-1">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={`flex h-8 items-center gap-2 rounded-control px-3 text-[13px] ${view === v.id ? "bg-accent/12 text-accent" : "text-fg2 hover:bg-elevated"}`}
            >
              {v.label}
              <span className="tnum text-[11px] text-muted">{counts[v.id]}</span>
            </button>
          ))}
        </div>
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filtrar…" className="w-52" />
      </div>

      {error && <div className="rounded-card border border-danger/40 p-4 text-danger">Erro ao carregar: {String(error)}</div>}

      <ul className="divide-y divide-line rounded-card border border-line bg-surface">
        {visible.map((t) => (
          <li key={t.id} className="flex items-center gap-3 px-4 py-3 hover:bg-elevated/60">
            <Checkbox checked={t.status === "done"} label={`Concluir ${t.title}`} onChange={(v) => toggle.mutate({ id: t.id, done: v })} />
            <button onClick={() => openTask(t.id)} className="flex flex-1 items-center gap-3 text-left">
              <span className={`flex-1 truncate ${t.status === "done" ? "text-muted line-through" : ""}`}>{t.title}</span>
              {t.status === "in_progress" && <Badge tone="accent">Em andamento</Badge>}
              {t.priority >= 2 && t.status !== "done" && <Badge tone={PRIORITY_TONE[t.priority]}>{PRIORITY_LABEL[t.priority]}</Badge>}
              {t.due_date && (
                <span className={`tnum text-[12px] ${isOverdue(t, today) ? "text-danger" : "text-muted"}`}>
                  {formatShort(t.due_date)}{t.due_time ? ` · ${t.due_time}` : ""}
                </span>
              )}
            </button>
          </li>
        ))}
        {visible.length === 0 && (
          <li>
            <EmptyState title={view === "overdue" ? "Nada atrasado" : "Nenhuma tarefa aqui"} hint="Digite acima e pressione Enter para criar." />
          </li>
        )}
      </ul>
      <TaskPanel tasks={data} />
    </div>
  );
}
