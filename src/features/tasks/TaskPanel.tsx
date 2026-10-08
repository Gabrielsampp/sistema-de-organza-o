import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, Checkbox, Drawer, Field, Input, Segmented, Select, Textarea } from "@/components/ui";
import { addDays, todayISO } from "@/lib/dates";
import { useUi } from "@/stores/ui";
import { PRIORITY_LABEL, RECURRENCE_LABEL, STATUS_LABEL, type Recurrence, type Task, type TaskStatus } from "./domain";
import { addSubtask, createTask, deleteSubtask, deleteTask, listSubtasks, toggleSubtask, updateTask } from "./repository";
import { setTaskStatus } from "./service";

interface Draft { title: string; description: string; priority: number; status: TaskStatus; due_date: string; due_time: string; category: string; recurrence: "" | Recurrence }
const blank = (): Draft => ({ title: "", description: "", priority: 1, status: "pending", due_date: todayISO(), due_time: "", category: "", recurrence: "" });
const fromTask = (t: Task): Draft => ({ title: t.title, description: t.description, priority: t.priority, status: t.status, due_date: t.due_date ?? "", due_time: t.due_time ?? "", category: t.category ?? "", recurrence: t.recurrence ?? "" });

export function TaskPanel({ tasks }: { tasks: Task[] }) {
  const id = useUi((s) => s.openTaskId);
  const close = () => useUi.getState().openTask(null);
  const isNew = id === "new";
  const task = tasks.find((t) => t.id === id);
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries();

  const [d, setD] = useState<Draft | null>(null);
  const [pending, setPending] = useState<string[]>([]); // subtarefas de uma tarefa ainda não criada
  const [newSub, setNewSub] = useState("");
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setError(null); setPending([]); setNewSub("");
    setD(isNew ? blank() : task ? fromTask(task) : null);
  }, [id, task?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const subs = useQuery({ queryKey: ["subtasks", id], queryFn: () => listSubtasks(id!), enabled: !!id && !isNew });
  const categories = [...new Set(tasks.map((t) => t.category).filter((c): c is string => !!c))];

  const save = useMutation({
    mutationFn: async () => {
      if (!d) return;
      if (!d.title.trim()) throw new Error("Informe um título.");
      if (d.recurrence && !d.due_date) throw new Error("Tarefa recorrente precisa de uma data.");
      const fields = {
        title: d.title, description: d.description, priority: d.priority as Task["priority"], due_date: d.due_date || null, due_time: d.due_time || null,
        category: d.category.trim() || null, recurrence: d.recurrence || null,
      };
      if (isNew) {
        const newId = await createTask(fields);
        for (const s of pending) await addSubtask(newId, s);
        if (d.status !== "pending") await setTaskStatus({ ...blankTask(newId, fields), status: "pending" }, d.status);
        return;
      }
      if (!task) return;
      await updateTask(task.id, fields);
      if (d.status !== task.status) await setTaskStatus({ ...task, ...fields, recurrence: fields.recurrence }, d.status);
    },
    onSuccess: () => { refresh(); close(); },
    onError: (e) => setError(e instanceof Error ? e.message : String(e)),
  });
  const del = useMutation({ mutationFn: () => deleteTask(id!), onSuccess: () => { refresh(); close(); } });
  const addSub = useMutation({ mutationFn: () => addSubtask(id!, newSub), onSuccess: () => { setNewSub(""); refresh(); } });

  const submitSub = () => {
    const v = newSub.trim();
    if (!v) return;
    if (isNew) { setPending([...pending, v]); setNewSub(""); } else addSub.mutate();
  };

  return (
    <Drawer open={!!id && !!d} onClose={close} title={isNew ? "Nova tarefa" : "Tarefa"}>
      {d && (
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
          <Field label="Título"><Input autoFocus value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} /></Field>
          <Field label="Descrição"><Textarea value={d.description} onChange={(e) => setD({ ...d, description: e.target.value })} /></Field>
          <Field label="Prioridade">
            <Segmented value={String(d.priority)} onChange={(v) => setD({ ...d, priority: Number(v) })}
              options={PRIORITY_LABEL.map((l, i) => ({ value: String(i), label: l, tone: i >= 2 ? ("danger" as const) : undefined }))} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Data"><Input type="date" value={d.due_date} onChange={(e) => setD({ ...d, due_date: e.target.value })} /></Field>
            <Field label="Horário"><Input type="time" value={d.due_time} onChange={(e) => setD({ ...d, due_time: e.target.value })} /></Field>
          </div>
          <div className="flex gap-1.5 text-[12px]">
            {([["Hoje", 0], ["Amanhã", 1], ["+1 semana", 7]] as const).map(([l, n]) => (
              <button type="button" key={l} onClick={() => setD({ ...d, due_date: addDays(todayISO(), n) })} className="rounded-control border border-line-strong px-2 py-1 text-fg2 hover:bg-elevated">{l}</button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Categoria">
              <Input list="task-cats" value={d.category} onChange={(e) => setD({ ...d, category: e.target.value })} placeholder="Ex.: Trabalho" />
              <datalist id="task-cats">{categories.map((c) => <option key={c} value={c} />)}</datalist>
            </Field>
            <Field label="Repetir">
              <Select value={d.recurrence} onChange={(e) => setD({ ...d, recurrence: e.target.value as Draft["recurrence"] })}>
                <option value="">Não repete</option>
                {(Object.keys(RECURRENCE_LABEL) as Recurrence[]).map((r) => <option key={r} value={r}>{RECURRENCE_LABEL[r]}</option>)}
              </Select>
            </Field>
          </div>
          <Field label="Status">
            <Select value={d.status} onChange={(e) => setD({ ...d, status: e.target.value as TaskStatus })}>
              {(Object.keys(STATUS_LABEL) as TaskStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </Select>
          </Field>
          {d.recurrence && <p className="text-[12px] text-muted">Ao concluir, a próxima ocorrência é criada automaticamente.</p>}

          <div>
            <div className="mb-2 text-[12px] text-muted">Subtarefas</div>
            <ul className="space-y-1.5">
              {(subs.data ?? []).map((s) => (
                <li key={s.id} className="group flex items-center gap-2.5">
                  <Checkbox checked={!!s.done_at} label={s.title} onChange={(v) => toggleSubtask(s.id, v).then(refresh)} />
                  <span className={`flex-1 ${s.done_at ? "text-muted line-through" : ""}`}>{s.title}</span>
                  <button type="button" aria-label="Remover subtarefa" onClick={() => deleteSubtask(s.id).then(refresh)} className="text-faint opacity-0 hover:text-danger group-hover:opacity-100"><Trash2 size={13} /></button>
                </li>
              ))}
              {pending.map((s, i) => (
                <li key={i} className="flex items-center gap-2.5 text-fg2">
                  <span className="size-[18px] rounded-[5px] border border-line-strong" /><span className="flex-1">{s}</span>
                  <button type="button" aria-label="Remover" onClick={() => setPending(pending.filter((_, j) => j !== i))} className="text-faint hover:text-danger"><X size={13} /></button>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex gap-2">
              <Input value={newSub} onChange={(e) => setNewSub(e.target.value)} placeholder="Nova subtarefa" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submitSub(); } }} />
              <Button type="button" onClick={submitSub} aria-label="Adicionar subtarefa"><Plus size={14} /></Button>
            </div>
          </div>

          {error && <p className="text-[12px] text-danger">{error}</p>}
          <div className="flex justify-between border-t border-line pt-4">
            {!isNew ? <Button type="button" variant="danger" onClick={() => del.mutate()}><Trash2 size={14} /> Excluir</Button> : <span />}
            <Button type="submit" variant="primary" disabled={save.isPending}>{isNew ? "Criar tarefa" : "Salvar"}</Button>
          </div>
        </form>
      )}
    </Drawer>
  );
}

const blankTask = (id: string, f: { title: string; description: string; priority: number; due_date: string | null; due_time: string | null; category: string | null; recurrence: Recurrence | null }): Task => ({
  id, title: f.title.trim(), description: f.description, priority: f.priority as Task["priority"], status: "pending", due_date: f.due_date, due_time: f.due_time,
  completed_at: null, position: 0, category: f.category, recurrence: f.recurrence, series_id: null,
});
