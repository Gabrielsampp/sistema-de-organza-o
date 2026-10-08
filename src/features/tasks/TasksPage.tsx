import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Badge, Button, Checkbox, EmptyState, Input, Kbd } from "@/components/ui";
import { formatShort, todayISO } from "@/lib/dates";
import { useUi } from "@/stores/ui";
import { BoardView } from "./BoardView";
import { CalendarView } from "./CalendarView";
import { PRIORITY_LABEL, categoryColor, filterByView, isOverdue, sortTasks, type Task, type TaskView } from "./domain";
import { TaskPanel } from "./TaskPanel";
import { createTask, listTasks } from "./repository";
import { setTaskStatus } from "./service";

type Mode = TaskView | "calendar" | "board";
const MODES: { id: Mode; label: string }[] = [
  { id: "today", label: "Hoje" }, { id: "upcoming", label: "Próximas" }, { id: "overdue", label: "Atrasadas" },
  { id: "all", label: "Todas" }, { id: "calendar", label: "Calendário" }, { id: "board", label: "Quadro" },
];
const PRIORITY_TONE = ["neutral", "accent", "warning", "danger"] as const;
const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export function TasksPage() {
  const qc = useQueryClient();
  const [mode, setMode] = useState<Mode>("today");
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const addRef = useRef<HTMLInputElement>(null);
  const openTask = useUi((s) => s.openTask);
  const tick = useUi((s) => s.quickAddTick);
  const today = todayISO();

  const { data = [], error } = useQuery({ queryKey: ["tasks"], queryFn: listTasks });
  useEffect(() => { if (tick > 0) addRef.current?.focus(); }, [tick]);

  const add = useMutation({
    mutationFn: () => createTask({ title, due_date: mode === "today" ? today : null, category: cat }),
    onSuccess: () => { setTitle(""); qc.invalidateQueries(); },
  });
  const toggle = useMutation({
    mutationFn: ({ t, done }: { t: Task; done: boolean }) => setTaskStatus(t, done ? "done" : "pending"),
    onSuccess: () => qc.invalidateQueries(),
  });

  const categories = useMemo(() => [...new Set(data.map((t) => t.category).filter((c): c is string => !!c))].sort(), [data]);
  const scoped = useMemo(() => {
    const nq = norm(search.trim());
    return data.filter((t) => (!cat || t.category === cat) && (!nq || norm(t.title).includes(nq)));
  }, [data, cat, search]);
  const listMode = mode === "calendar" || mode === "board" ? "all" : mode;
  const visible = useMemo(() => sortTasks(filterByView(scoped, listMode, today)), [scoped, listMode, today]);
  const counts = useMemo(() => Object.fromEntries((["today", "upcoming", "overdue", "all"] as TaskView[]).map((v) => [v, filterByView(data, v, today).filter((t) => v === "all" || v === "today" || t.status !== "done").length])) as Record<TaskView, number>, [data, today]);

  return (
    <div className="mx-auto max-w-[1100px] px-10 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-[28px] font-bold uppercase tracking-wide">Tarefas</h1>
        <Button variant="primary" onClick={() => openTask("new")}><Plus size={14} /> Nova tarefa</Button>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); if (title.trim()) add.mutate(); }} className="mb-5 flex items-center gap-3">
        <Input ref={addRef} value={title} onChange={(e) => setTitle(e.target.value)} className="h-10 text-[14px]"
          placeholder={mode === "today" ? "Adição rápida para hoje — Enter" : "Adição rápida — Enter (use “Nova tarefa” para mais opções)"} />
        <Kbd>Ctrl+N</Kbd>
      </form>

      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-1">
          {MODES.map((m) => (
            <button key={m.id} onClick={() => setMode(m.id)} className={`flex h-8 items-center gap-2 rounded-control px-3 text-[13px] ${mode === m.id ? "bg-accent/15 text-accent" : "text-fg2 hover:bg-elevated"}`}>
              {m.label}{m.id in counts && <span className="tnum text-[11px] text-muted">{counts[m.id as TaskView]}</span>}
            </button>
          ))}
        </div>
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filtrar…" className="w-48" />
      </div>

      {categories.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          <button onClick={() => setCat(null)} className={`rounded-full border px-3 py-1 text-[12px] ${cat === null ? "border-accent/50 bg-accent/15 text-accent" : "border-line-strong text-fg2 hover:bg-elevated"}`}>Todas as categorias</button>
          {categories.map((c) => (
            <button key={c} onClick={() => setCat(cat === c ? null : c)} className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] ${cat === c ? "border-accent/50 bg-accent/15 text-accent" : "border-line-strong text-fg2 hover:bg-elevated"}`}>
              <span className="size-1.5 rounded-full" style={{ background: categoryColor(c) }} />{c}
            </button>
          ))}
        </div>
      )}

      {error && <div className="mb-4 rounded-card border border-danger/40 p-4 text-danger">Erro ao carregar: {String(error)}</div>}

      {mode === "calendar" ? <CalendarView tasks={scoped} /> : mode === "board" ? <BoardView tasks={scoped} /> : (
        <ul className="divide-y divide-line rounded-card border border-line bg-surface">
          {visible.map((t) => (
            <li key={t.id} className="flex items-center gap-3 px-4 py-3 hover:bg-elevated/60">
              <Checkbox round checked={t.status === "done"} label={`Concluir ${t.title}`} onChange={(v) => toggle.mutate({ t, done: v })} />
              <button onClick={() => openTask(t.id)} className="flex flex-1 items-center gap-3 text-left">
                <span className={`flex-1 truncate ${t.status === "done" ? "text-muted line-through" : ""}`}>{t.title}</span>
                {t.recurrence && <RefreshCw size={12} className="text-muted" aria-label="Recorrente" />}
                {t.category && <span className="flex items-center gap-1.5 text-[11px] text-fg2"><span className="size-1.5 rounded-full" style={{ background: categoryColor(t.category) }} />{t.category}</span>}
                {t.status === "in_progress" && <Badge tone="accent">Em andamento</Badge>}
                {t.priority >= 2 && t.status !== "done" && <Badge tone={PRIORITY_TONE[t.priority]}>{PRIORITY_LABEL[t.priority]}</Badge>}
                {t.due_date && <span className={`tnum text-[12px] ${isOverdue(t, today) ? "text-danger" : "text-muted"}`}>{formatShort(t.due_date)}{t.due_time ? ` · ${t.due_time}` : ""}</span>}
              </button>
            </li>
          ))}
          {visible.length === 0 && <li><EmptyState title={mode === "overdue" ? "Nada atrasado" : "Nenhuma tarefa aqui"} hint="Use a adição rápida ou “Nova tarefa”." /></li>}
        </ul>
      )}
      <TaskPanel tasks={data} />
    </div>
  );
}
