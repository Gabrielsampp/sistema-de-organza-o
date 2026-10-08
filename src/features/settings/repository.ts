import { execute, nowUTC, select } from "@/db/client";

export async function getProfileName(): Promise<string> {
  const rows = await select<{ name: string }>("SELECT name FROM user_profile WHERE id = 1");
  return rows[0]?.name ?? "";
}

export const setProfileName = (name: string) =>
  execute(
    `INSERT INTO user_profile (id,name,updated_at) VALUES (1,$1,$2)
     ON CONFLICT(id) DO UPDATE SET name = excluded.name, updated_at = excluded.updated_at`,
    [name.trim(), nowUTC()],
  );

/** Backup consistente (inclui o WAL). VACUUM INTO falha se o arquivo já existir; o diálogo confirma sobrescrita antes. */
export async function backupTo(path: string): Promise<void> {
  await execute("VACUUM INTO $1", [path]);
}
