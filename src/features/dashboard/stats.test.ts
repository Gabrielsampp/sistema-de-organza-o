import { expect, it } from "vitest";
import { activityByDay } from "./stats";

it("agrega tarefas e hábitos por dia", () => {
  const noon = new Date(2026, 9, 7, 12).toISOString(); // 07/10 local
  const r = activityByDay([{ completed_at: noon }, { completed_at: null }], [{ date: "2026-10-07" }, { date: "2026-10-07" }], ["2026-10-06", "2026-10-07"]);
  expect(r).toEqual([{ day: "06", tasks: 0, habits: 0 }, { day: "07", tasks: 1, habits: 2 }]);
});
