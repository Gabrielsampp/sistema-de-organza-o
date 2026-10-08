import { useQuery, useQueryClient } from "@tanstack/react-query";
import { save } from "@tauri-apps/plugin-dialog";
import { useEffect, useState } from "react";
import { Button, Card, Field, Input, Label } from "@/components/ui";
import { backupTo, getProfileName, setProfileName } from "./repository";

export function SettingsPage() {
  const qc = useQueryClient();
  const name = useQuery({ queryKey: ["profile-name"], queryFn: getProfileName });
  const [draft, setDraft] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  useEffect(() => setDraft(name.data ?? ""), [name.data]);

  async function doBackup() {
    setMsg(null);
    try {
      const stamp = new Date().toISOString().slice(0, 10);
      const path = await save({ defaultPath: `atlas-backup-${stamp}.db`, filters: [{ name: "SQLite", extensions: ["db"] }] });
      if (!path) return;
      await backupTo(path);
      setMsg({ ok: true, text: `Backup salvo em ${path}` });
    } catch (e) {
      setMsg({ ok: false, text: `Falha no backup: ${String(e)}` });
    }
  }

  return (
    <div className="mx-auto max-w-[680px] px-10 py-8">
      <h1 className="mb-6 font-display text-[28px] font-bold uppercase tracking-wide">Configurações</h1>
      <div className="space-y-4">
        <Card>
          <Label>Perfil</Label>
          <form
            className="flex items-end gap-3"
            onSubmit={async (e) => { e.preventDefault(); await setProfileName(draft); qc.invalidateQueries(); }}
          >
            <div className="flex-1"><Field label="Nome"><Input value={draft} onChange={(e) => setDraft(e.target.value)} /></Field></div>
            <Button variant="primary" type="submit">Salvar</Button>
          </form>
        </Card>
        <Card>
          <Label>Dados</Label>
          <p className="mb-4 text-fg2">Todos os dados ficam em um banco SQLite local. Nenhuma informação sai do computador.</p>
          <Button onClick={doBackup}>Exportar backup…</Button>
          {msg && <p className={`mt-3 text-[12px] ${msg.ok ? "text-success" : "text-danger"}`}>{msg.text}</p>}
        </Card>
        <Card>
          <Label>Atalhos</Label>
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-fg2">
            <dt className="text-fg">Ctrl+K</dt><dd>Busca global</dd>
            <dt className="text-fg">Ctrl+N</dt><dd>Novo item na tela atual</dd>
            <dt className="text-fg">Ctrl+1 / 2 / 3</dt><dd>Início / Tarefas / Hábitos</dd>
            <dt className="text-fg">Ctrl+B</dt><dd>Recolher sidebar</dd>
            <dt className="text-fg">Esc</dt><dd>Fechar painel</dd>
          </dl>
        </Card>
      </div>
    </div>
  );
}
