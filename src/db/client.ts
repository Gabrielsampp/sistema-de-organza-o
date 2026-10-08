import Database from "@tauri-apps/plugin-sql";

const DB_URL = "sqlite:atlas.db";
let dbPromise: Promise<Database> | null = null;

/** As migrations rodam no Rust (lib.rs) ao primeiro load. */
export function getDb(): Promise<Database> {
  dbPromise ??= Database.load(DB_URL);
  return dbPromise;
}

export async function select<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  return (await getDb()).select<T[]>(sql, params);
}

export async function execute(sql: string, params: unknown[] = []): Promise<void> {
  await (await getDb()).execute(sql, params);
}

export const nowUTC = () => new Date().toISOString();
