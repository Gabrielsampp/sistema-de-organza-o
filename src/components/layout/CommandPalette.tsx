import { useQuery } from "@tanstack/react-query";
import { CheckSquare, CornerDownLeft, Flame, Navigation, Wallet } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Kbd } from "@/components/ui";
import { listTransactions } from "@/features/finances/repository";
import { listHabits } from "@/features/habits/repository";
import { listTasks } from "@/features/tasks/repository";
import { useUi, type Route } from "@/stores/ui";

const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

interface Item {
  id: string;
  label: string;
  hint: string;
  icon: typeof Navigation;
  run: () => void;
}

export function CommandPalette() {
  const open = useUi((s) => s.paletteOpen);
  const setOpen = useUi((s) => s.setPalette);
  const navigate = useUi((s) => s.navigate);
  const openTask = useUi((s) => s.openTask);
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const tasks = useQuery({ queryKey: ["tasks"], queryFn: listTasks, enabled: open });
  const habits = useQuery({ queryKey: ["habits"], queryFn: listHabits, enabled: open });
  const txs = useQuery({ queryKey: ["txs"], queryFn: listTransactions, enabled: open });
  const openTx = useUi((s) => s.openTx);

  useEffect(() => {
    if (open) {
      setQ("");
      setIdx(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const items = useMemo<Item[]>(() => {
    const go = (r: Route, label: string): Item => ({ id: `nav:${r}`, label, hint: "Ir para", icon: Navigation, run: () => navigate(r) });
    const all: Item[] = [go("dashboard", "Início"), go("tasks", "Tarefas"), go("habits", "Hábitos"), go("finances", "Finanças"), go("settings", "Configurações")];
    for (const t of tasks.data ?? [])
      all.push({ id: `t:${t.id}`, label: t.title, hint: "Tarefa", icon: CheckSquare, run: () => { navigate("tasks"); openTask(t.id); } });
    for (const h of habits.data ?? [])
      all.push({ id: `h:${h.id}`, label: h.name, hint: "Hábito", icon: Flame, run: () => navigate("habits") });
    for (const t of txs.data ?? [])
      if (t.description) all.push({ id: `x:${t.id}`, label: t.description, hint: "Transação", icon: Wallet, run: () => { navigate("finances"); openTx(t.id); } });
    const nq = norm(q.trim());
    return (nq ? all.filter((i) => norm(i.label).includes(nq)) : all.slice(0, 8)).slice(0, 12);
  }, [q, tasks.data, habits.data, txs.data, navigate, openTask, openTx]);

  if (!open) return null;
  const choose = (i: Item | undefined) => {
    if (!i) return;
    setOpen(false);
    i.run();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-[14vh]" onMouseDown={() => setOpen(false)}>
      <div
        className="w-[560px] overflow-hidden rounded-modal border border-line-strong bg-surface shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Busca global"
      >
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => { setQ(e.target.value); setIdx(0); }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(i + 1, items.length - 1)); }
            if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); }
            if (e.key === "Enter") choose(items[idx]);
          }}
          placeholder="Buscar tarefas, hábitos ou ir para…"
          className="h-12 w-full border-b border-line bg-transparent px-4 text-[14px] placeholder:text-faint"
        />
        <ul className="max-h-[340px] overflow-y-auto p-2">
          {items.length === 0 && <li className="px-3 py-6 text-center text-[13px] text-muted">Nada encontrado</li>}
          {items.map((it, n) => {
            const Icon = it.icon;
            return (
              <li key={it.id}>
                <button
                  onMouseEnter={() => setIdx(n)}
                  onClick={() => choose(it)}
                  className={`flex w-full items-center gap-3 rounded-control px-3 py-2 text-left ${n === idx ? "bg-elevated" : ""}`}
                >
                  <Icon size={15} className="text-muted" />
                  <span className="flex-1 truncate">{it.label}</span>
                  <span className="text-[11px] text-muted">{it.hint}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="flex items-center gap-3 border-t border-line px-4 py-2 text-[11px] text-muted">
          <span className="flex items-center gap-1"><Kbd>↑↓</Kbd> navegar</span>
          <span className="flex items-center gap-1"><Kbd><CornerDownLeft size={10} /></Kbd> abrir</span>
          <span className="flex items-center gap-1"><Kbd>Esc</Kbd> fechar</span>
        </div>
      </div>
    </div>
  );
}
