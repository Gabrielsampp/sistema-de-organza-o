/** Datas de calendário são strings 'YYYY-MM-DD' no fuso local. Nunca use toISOString() para isso. */
const pad = (n: number) => String(n).padStart(2, "0");

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number) as [number, number, number];
  return new Date(y, m - 1, d, 12); // meio-dia evita problemas de DST
}

export const todayISO = () => toISODate(new Date());

export function addDays(iso: string, n: number): string {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

/** 0 = domingo .. 6 = sábado */
export const weekdayOf = (iso: string) => parseISODate(iso).getDay();

export function greeting(now = new Date()): string {
  const h = now.getHours();
  if (h < 5) return "Boa madrugada";
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export function formatLongDate(now = new Date()): string {
  const s = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long" }).format(now);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatShort(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" })
    .format(parseISODate(iso))
    .replace(".", "");
}

/** Soma meses mantendo o dia; se o dia não existir no mês destino, usa o último dia (31/01 + 1 → 28/02). */
export function addMonths(iso: string, n: number): string {
  const d = parseISODate(iso);
  const day = d.getDate();
  const target = new Date(d.getFullYear(), d.getMonth() + n, 1, 12);
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(day, last));
  return toISODate(target);
}

/** Converte um instante UTC ISO para a data local 'YYYY-MM-DD'. */
export const localDateOf = (utcIso: string): string => toISODate(new Date(utcIso));
