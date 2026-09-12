import { describe, expect, it } from "vitest";

describe("development foundation smoke test", () => {
  it("runs pure TypeScript through Vitest", () => {
    const add = (a: number, b: number): number => a + b;
    expect(add(2, 3)).toBe(5);
  });
});
