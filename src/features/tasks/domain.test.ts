import { describe, expect, it } from "vitest";
import { monthGrid, nextDueFrom, nextOccurrence } from "./domain";

describe("nextOccurrence", () => {
  it("diária/semanal/mensal", () => {
    expect(nextOccurrence("2026-10-08", "daily")).toBe("2026-10-09");
    expect(nextOccurrence("2026-10-08", "weekly")).toBe("2026-10-15");
    expect(nextOccurrence("2026-01-31", "monthly")).toBe("2026-02-28");
  });
  it("dias úteis pula o fim de semana (sex 2026-10-09 → seg 12)", () => {
    expect(nextOccurrence("2026-10-09", "weekdays")).toBe("2026-10-12");
  });
});
describe("nextDueFrom", () => {
  it("não gera ocorrência no passado", () => {
    expect(nextDueFrom("2026-10-01", "daily", "2026-10-08")).toBe("2026-10-08");
  });
});
describe("monthGrid", () => {
  it("tem 42 células e começa no domingo", () => {
    const g = monthGrid(2026, 9); // outubro/2026 começa numa quinta
    expect(g).toHaveLength(42);
    expect(g[0]!.date).toBe("2026-09-27");
    expect(g.filter((c) => c.inMonth)).toHaveLength(31);
  });
});
