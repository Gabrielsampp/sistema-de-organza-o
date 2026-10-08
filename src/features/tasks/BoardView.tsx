import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Badge } from "@/components/ui";
import { formatShort, todayISO } from "@/lib/dates";
import { useUi } from "@/stores/ui";
import { PRIORITY_LABEL, STATUS_LABEL, categoryColor, isOverdue, sortTasks, type Task, type TaskStatus } from "./domain";
import { setTaskStatus } from "./service";

const COLS: TaskStatus[] = ["pending", "in_progress", "done"];

/** Arrastar e soltar (HTML5 DnD; o Tauri precisa de dragDropEnabled:false, já configurado). */
export function BoardView({ tasks }: { tasks: Task[] }) {
  const qc = useQueryClient();
  const openTask = useUi((s) => s.openTask);
  const [over, setOver] = useState<TaskStatus | null>(null);
  const today = todayISO();
  const move = useMutation({ mutationFn: ({ t, s }: { t: Task; s: TaskStatus }) => setTaskStatus(t, s), onSuccess: () => qc.invalidateQueries() });

  return (
    <div className="grid grid-cols-3 gap-4">
      {COLS.map((col) => {
        const list = sortTasks(tasks.filter((t) => t.status === col));
        return (
          <div key={col}
            onDragOver={(e) => { e.preventDefault(); setOver(col); }}
            onDragLeave={() => setOver((o) => (o === col ? null : o))}
            onDrop={(e) => {
              e.preventDefault(); setOver(null);
              const t = tasks.find((x) => x.id === e.dataTransfer.getData("text/plain"));
              if (t && t.status !== col) move.mutate({ t, s: col });
            }}
            className={`min-h-[320px] rounded-card border p-3 transition-colors ${over === col ? "border-accent/60 bg-accent/[0.04]" : "border-line bg-surface"}`}>
            <div className="mb-3 flex items-center justify-between px-1">
              <span className="font-display text-[13px] font-semibold uppercase tracking-wide">{STATUS_LABEL[col]}</span>
              <span className="tnum text-[12px] text-muted">{list.length}</span>
            </div>
            <div className="space-y-2">
              {list.map((t) => (
                <div key={t.id} draggable onDragStart={(e) => e.dataTransfer.setData("text/plain", t.id)} onClick={() => openTask(t.id)}
                  className="cursor-grab rounded-control border border-line bg-elevated p-3 active:cursor-grabbing hover:border-line-strong">
                  <div className={`mb-2 text-[13px] ${t.status === "done" ? "text-muted line-through" : ""}`}>{t.title}</div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {t.category && <span className="flex items-center gap-1 text-[11px] text-fg2"><span className="size-1.5 rounded-full" style={{ background: categoryColor(t.category) }} />{t.category}</span>}
                    {t.priority >= 2 && t.status !== "done" && <Badge tone={t.priority === 3 ? "danger" : "warning"}>{PRIORITY_LABEL[t.priority]}</Badge>}
                    {t.due_date && <span className={`tnum ml-auto text-[11px] ${isOverdue(t, today) ? "text-danger" : "text-muted"}`}>{formatShort(t.due_date)}</span>}
                  </div>
                </div>
              ))}
              {list.length === 0 && <div className="py-8 text-center text-[12px] text-faint">Solte tarefas aqui</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
