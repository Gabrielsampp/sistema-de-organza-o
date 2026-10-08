import { describe, expect, it } from "vitest";
import { calcStreaks, completionRate } from "./domain";

const set = (...d: string[]) => new Set(d);
// 2026-10-08 é quinta-feira
describe("calcStreaks", () => {
  it("conta sequência diária e não quebra com hoje pendente", () => {
    const r = calcStreaks(set("2026-10-05", "2026-10-06", "2026-10-07"), 127, "2026-10-01", "2026-10-08");
    expect(r.current).toBe(3);
  });
  it("quebra com dia agendado perdido", () => {
    const r = calcStreaks(set("2026-10-05", "2026-10-07", "2026-10-08"), 127, "2026-10-01", "2026-10-08");
    expect(r.current).toBe(2);
    expect(r.best).toBe(2);
  });
  it("maior sequência é preservada depois de quebra", () => {
    const r = calcStreaks(set("2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04"), 127, "2026-10-01", "2026-10-08");
    expect(r.best).toBe(4);
    expect(r.current).toBe(0);
  });
  it("ignora dias não agendados (somente seg-sex: bits 1..5 = 62)", () => {
    // 2026-10-02 sex, 03 sáb, 04 dom, 05 seg
    const r = calcStreaks(set("2026-10-02", "2026-10-05"), 62, "2026-10-01", "2026-10-05");
    expect(r.current).toBe(2);
  });
  it("hábito futuro não tem sequência", () => {
    expect(calcStreaks(set(), 127, "2026-10-20", "2026-10-08")).toEqual({ current: 0, best: 0 });
  });
});

describe("completionRate", () => {
  it("calcula percentual na janela", () => {
    expect(completionRate(set("2026-10-08", "2026-10-07"), 127, "2026-10-05", "2026-10-08", 4)).toBe(50);
  });
  it("null sem dias agendados", () => {
    expect(completionRate(set(), 127, "2026-10-20", "2026-10-08")).toBeNull();
  });
});

import { rateInRange } from "./domain";
describe("rateInRange", () => {
  it("respeita início e intervalo", () => {
    expect(rateInRange(new Set(["2026-10-06"]), 127, "2026-10-05", "2026-10-01", "2026-10-08")).toBe(25); // dias 05..08, 1 concluído
  });
  it("null sem dias", () => {
    expect(rateInRange(new Set(), 127, "2026-10-20", "2026-10-01", "2026-10-08")).toBeNull();
  });
});

import { dailyHabitRate, type Habit } from "./domain";
describe("dailyHabitRate", () => {
  const h = (id: string, start = "2026-10-01"): Habit => ({ id, name: id, description: "", weekdays_mask: 127, start_date: start, category: null, time_of_day: null });
  it("calcula por dia e retorna null sem hábitos agendados", () => {
    const done = new Map([["a", new Set(["2026-10-07"])], ["b", new Set<string>()]]);
    expect(dailyHabitRate([h("a"), h("b")], done, ["2026-10-07", "2026-09-30"])).toEqual([50, null]);
  });
});
