import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, Checkbox, Drawer, Field, Input, Textarea } from "@/components/ui";
import { useUi } from "@/stores/ui";
import { PRIORITY_LABEL, STATUS_LABEL, type Task, type TaskStatus } from "./domain";
import { addSubtask, deleteSubtask, deleteTask, listSubtasks, toggleSubtask, updateTask } from "./repository";

const select = "h-8 w-full rounded-control border border-line-strong bg-base px-2 text-[13px] focus:border-accent";

export function TaskPanel({ tasks }: { tasks: Task[] }) {
  const id = useUi((s) => s.openTaskId);
  const close = () => useUi.getState().openTask(null);
  const task = tasks.find((t) => t.id === id);
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries();

  const [draft, setDraft] = useState<Task | null>(null);
  const [newSub, setNewSub] = useState("");
  useEffect(() => setDraft(task ?? null), [task?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const subs = useQuery({ queryKey: ["subtasks", id], queryFn: () => listSubtasks(id!), enabled: !!id });

  const save = useMutation({
    mutationFn: () =>
      updateTask(draft!.id, {
        title: draft!.title.trim() || task!.title,
        description: draft!.description,
        priority: draft!.priority,
        status: draft!.status,
        due_date: draft!.due_date || null,
        due_time: draft!.due_time || null,
      }),
    onSuccess: () => { refresh(); close(); },
  });
  const del = useMutation({ mutationFn: () => deleteTask(id!), onSuccess: () => { refresh(); close(); } });
  const addSub = useMutation({ mutationFn: () => addSubtask(id!, newSub), onSuccess: () => { setNewSub(""); refresh(); } });

  return (
    <Drawer open={!!id && !!draft} onClose={close} title="Tarefa">
      {draft && (
        <div className="space-y-4">
          <Field label="Título">
            <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          </Field>
          <Field label="Descrição">
            <Textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Prioridade">
              <select className={select} value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: Number(e.target.value) as Task["priority"] })}>
                {PRIORITY_LABEL.map((l, i) => <option key={l} value={i}>{l}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select className={select} value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as TaskStatus })}>
                {(Object.keys(STATUS_LABEL) as TaskStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </select>
            </Field>
            <Field label="Data">
              <Input type="date" value={draft.due_date ?? ""} onChange={(e) => setDraft({ ...draft, due_date: e.target.value || null })} />
            </Field>
            <Field label="Horário">
              <Input type="time" value={draft.due_time ?? ""} onChange={(e) => setDraft({ ...draft, due_time: e.target.value || null })} />
            </Field>
          </div>

          <div>
            <div className="mb-2 text-[12px] text-muted">Subtarefas</div>
            <ul className="space-y-1.5">
              {(subs.data ?? []).map((s) => (
                <li key={s.id} className="group flex items-center gap-2.5">
                  <Checkbox checked={!!s.done_at} label={s.title} onChange={(v) => toggleSubtask(s.id, v).then(refresh)} />
                  <span className={`flex-1 ${s.done_at ? "text-muted line-through" : ""}`}>{s.title}</span>
                  <button aria-label="Remover subtarefa" onClick={() => deleteSubtask(s.id).then(refresh)} className="text-faint opacity-0 hover:text-danger group-hover:opacity-100">
                    <Trash2 size={13} />
                  </button>
                </li>
              ))}
            </ul>
            <form
              className="mt-2 flex gap-2"
              onSubmit={(e) => { e.preventDefault(); if (newSub.trim()) addSub.mutate(); }}
            >
              <Input value={newSub} onChange={(e) => setNewSub(e.target.value)} placeholder="Nova subtarefa" />
              <Button type="submit" aria-label="Adicionar subtarefa"><Plus size={14} /></Button>
            </form>
          </div>

          <div className="flex justify-between border-t border-line pt-4">
            <Button variant="danger" onClick={() => del.mutate()}><Trash2 size={14} /> Excluir</Button>
            <Button variant="primary" onClick={() => save.mutate()} disabled={save.isPending}>Salvar</Button>
          </div>
        </div>
      )}
    </Drawer>
  );
}
