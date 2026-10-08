/** Dinheiro: sempre inteiros em centavos. Nunca float armazenado. */
const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const formatBRL = (cents: number): string => BRL.format(cents / 100);

/** "1.234,56" | "12,5" | "12.50" | "R$ 10" → centavos. null se inválido ou com >2 casas decimais. */
export function parseBRL(input: string): number | null {
  let s = input.replace(/R\$|\s/g, "");
  if (!s) return null;
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
  const m = /^(\d+)(?:\.(\d{1,2}))?$/.exec(s);
  if (!m) return null;
  return Number(m[1]) * 100 + Number((m[2] ?? "").padEnd(2, "0"));
}

export const centsToInput = (cents: number): string => (cents / 100).toFixed(2).replace(".", ",");
