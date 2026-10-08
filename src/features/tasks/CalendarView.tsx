import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { todayISO } from "@/lib/dates";
import { useUi } from "@/stores/ui";
import { monthGrid, type Task } from "./domain";

const DOW = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function CalendarView({ tasks }: { tasks: Task[] }) {
  const now = new Date();
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const openTask = useUi((s) => s.openTask);
  const today = todayISO();
  const grid = useMemo(() => monthGrid(ym.y, ym.m), [ym]);
  const byDate = useMemo(() => {
    const m = new Map<string, Task[]>();
    for (const t of tasks) if (t.due_date) m.set(t.due_date, [...(m.get(t.due_date) ?? []), t]);
    return m;
  }, [tasks]);
  const shift = (n: number) => setYm(({ y, m }) => { const d = new Date(y, m + n, 1); return { y: d.getFullYear(), m: d.getMonth() }; });
  const label = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date(ym.y, ym.m, 1));

  return (
    <div>
      <div className="mb-3 flex items-center justify-center gap-3">
        <button aria-label="Mês anterior" onClick={() => shift(-1)} className="rounded p-1.5 text-muted hover:bg-elevated hover:text-fg"><ChevronLeft size={16} /></button>
        <span className="w-44 text-center font-display text-[14px] font-semibold uppercase tracking-wide">{label}</span>
        <button aria-label="Próximo mês" onClick={() => shift(1)} className="rounded p-1.5 text-muted hover:bg-elevated hover:text-fg"><ChevronRight size={16} /></button>
      </div>
      <div className="overflow-hidden rounded-card border border-line bg-surface">
        <div className="grid grid-cols-7 border-b border-line text-center text-[11px] uppercase tracking-wider text-muted">
          {DOW.map((d) => <div key={d} className="py-2">{d}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {grid.map((c, i) => {
            const list = byDate.get(c.date) ?? [];
            return (
              <div key={c.date} className={`min-h-[96px] border-b border-r border-line p-1.5 ${i % 7 === 6 ? "border-r-0" : ""} ${c.inMonth ? "" : "opacity-40"}`}>
                <div className={`tnum mb-1 flex size-5 items-center justify-center rounded-full text-[11px] ${c.date === today ? "bg-accent text-white" : "text-muted"}`}>{Number(c.date.slice(8))}</div>
                <div className="space-y-0.5">
                  {list.slice(0, 3).map((t) => (
                    <button key={t.id} onClick={() => openTask(t.id)}
                      className={`block w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] ${t.status === "done" ? "bg-elevated text-muted line-through" : t.priority >= 2 ? "bg-danger/15 text-danger" : "bg-accent/15 text-accent"}`}>
                      {t.title}
                    </button>
                  ))}
                  {list.length > 3 && <div className="px-1 text-[10px] text-muted">+{list.length - 3}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
