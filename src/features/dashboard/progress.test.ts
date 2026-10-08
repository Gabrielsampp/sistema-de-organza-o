import { expect, it } from "vitest";
import { dayProgress } from "./progress";

it("sem itens → pct nulo", () => {
  expect(dayProgress({ tasksDone: 0, tasksTotal: 0, habitsDone: 0, habitsTotal: 0 }).pct).toBeNull();
});
it("peso igual por item", () => {
  expect(dayProgress({ tasksDone: 1, tasksTotal: 2, habitsDone: 2, habitsTotal: 2 }).pct).toBe(75);
});
