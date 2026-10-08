import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, Drawer, Field, Input, Textarea } from "@/components/ui";
import { todayISO } from "@/lib/dates";
import { useUi } from "@/stores/ui";
import { ALL_DAYS, WEEKDAY_SHORT, type Habit } from "./domain";
import { createHabit, deleteHabit, updateHabit } from "./repository";

const PRESETS: [string, number][] = [["Todos os dias", ALL_DAYS], ["Seg–Sex", 0b0111110], ["Fim de semana", 0b1000001]];

export function HabitPanel({ habits }: { habits: Habit[] }) {
  const id = useUi((s) => s.openHabitId);
  const close = () => useUi.getState().openHabit(null);
  const isNew = id === "new";
  const habit = habits.find((h) => h.id === id);
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [time, setTime] = useState("");
  const [mask, setMask] = useState(ALL_DAYS);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    const h = isNew ? undefined : habit;
    setName(h?.name ?? ""); setDescription(h?.description ?? ""); setCategory(h?.category ?? ""); setTime(h?.time_of_day ?? ""); setMask(h?.weekdays_mask ?? ALL_DAYS);
  }, [id, habit?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("Informe um nome.");
      const base = { name, description, weekdays_mask: mask, category: category || null, time_of_day: time || null };
      if (isNew) await createHabit({ ...base, start_date: todayISO() });
      else if (habit) await updateHabit(habit.id, base);
    },
    onSuccess: () => { qc.invalidateQueries(); close(); },
    onError: (e) => setError(e instanceof Error ? e.message : String(e)),
  });
  const del = useMutation({ mutationFn: () => deleteHabit(habit!.id), onSuccess: () => { qc.invalidateQueries(); close(); } });

  const categories = [...new Set(habits.map((h) => h.category).filter((c): c is string => !!c))];

  return (
    <Drawer open={!!id && (isNew || !!habit)} onClose={close} title={isNew ? "Novo hábito" : "Editar hábito"}>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
        <Field label="Nome"><Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Beber 4 litros de água" /></Field>
        <Field label="Descrição"><Textarea value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Categoria">
            <Input list="habit-cats" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ex.: Saúde" />
            <datalist id="habit-cats">{categories.map((c) => <option key={c} value={c} />)}</datalist>
          </Field>
          <Field label="Horário (opcional)"><Input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></Field>
        </div>
        <div>
          <div className="mb-1.5 text-[12px] text-muted">Dias da semana</div>
          <div className="mb-2 flex gap-1" role="group" aria-label="Dias da semana">
            {WEEKDAY_SHORT.map((l, i) => {
              const on = (mask & (1 << i)) !== 0;
              return <button type="button" key={i} aria-pressed={on} onClick={() => setMask((m) => (m ^ (1 << i)) || m)} className={`size-9 rounded-control text-[12px] ${on ? "bg-accent/15 text-accent" : "bg-base text-muted hover:text-fg"}`}>{l}</button>;
            })}
          </div>
          <div className="flex gap-1.5 text-[12px]">
            {PRESETS.map(([l, m]) => <button type="button" key={l} onClick={() => setMask(m)} className="rounded-control border border-line-strong px-2 py-1 text-fg2 hover:bg-elevated">{l}</button>)}
          </div>
        </div>
        {error && <p className="text-[12px] text-danger">{error}</p>}
        <div className="flex justify-between border-t border-line pt-4">
          {!isNew ? <Button type="button" variant="danger" onClick={() => confirm(`Excluir "${name}"?`) && del.mutate()}><Trash2 size={14} /> Excluir</Button> : <span />}
          <Button type="submit" variant="primary" disabled={save.isPending}>{isNew ? "Criar hábito" : "Salvar"}</Button>
        </div>
      </form>
    </Drawer>
  );
}
