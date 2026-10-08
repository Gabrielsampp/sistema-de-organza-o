import { describe, expect, it } from "vitest";
import { parseBRL } from "./money";

describe("parseBRL", () => {
  it.each([
    ["10", 1000], ["10,5", 1050], ["1.234,56", 123456], ["12.50", 1250], ["1.234", 123400], ["R$ 0,99", 99], ["0,05", 5],
  ])("%s → %i", (i, o) => expect(parseBRL(i)).toBe(o));
  it.each(["", "abc", "10,555", "1,2,3", "-5"])("rejeita %s", (i) => expect(parseBRL(i)).toBeNull());
});
