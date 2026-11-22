import { describe, expect, it, vi } from "vitest";
import { sanitizePlans, type WorkoutPlan } from "./store";

const plan = (o: Partial<WorkoutPlan>): WorkoutPlan => ({
  id: "x",
  name: "x",
  rounds: 1,
  roundRest: 0,
  items: [],
  createdAt: 1,
  ...o,
});

describe("sanitizePlans", () => {
  it("removes results from the 200-round bug", () => {
    const { plans, changed } = sanitizePlans([
      plan({ lastResult: { rounds: 200, extra: 0, at: 1 }, bestResult: { rounds: 200, extra: 0, at: 1 } }),
    ]);
    expect(changed).toBe(true);
    expect(plans[0].bestResult).toBeUndefined();
    expect(plans[0].lastResult).toBeUndefined();
  });

  it("keeps valid results and reports no change", () => {
    const input = [plan({ bestResult: { rounds: 5, extra: 2, at: 1 } })];
    const { plans, changed } = sanitizePlans(input);
    expect(changed).toBe(false);
    expect(plans[0]).toBe(input[0]);
  });

  it("drops only a broken lastResult and keeps a valid bestResult", () => {
    const { plans, changed } = sanitizePlans([
      plan({ lastResult: { rounds: 200, extra: 0, at: 1 }, bestResult: { rounds: 5, extra: 1, at: 1 } }),
    ]);
    expect(changed).toBe(true);
    expect(plans[0].lastResult).toBeUndefined();
    expect(plans[0].bestResult).toEqual({ rounds: 5, extra: 1, at: 1 });
  });
});

describe("store read()", () => {
  it("writes the sanitized plans back to localStorage", async () => {
    localStorage.clear();
    const broken = { rounds: 200, extra: 0, at: 1 };
    localStorage.setItem("kb-workout-plans-v2", JSON.stringify([plan({ id: "bad", bestResult: broken, lastResult: broken })]));
    vi.resetModules();
    const store = await import("./store");
    expect(store.getPlans().find((p) => p.id === "bad")?.bestResult).toBeUndefined();
    const saved = JSON.parse(localStorage.getItem("kb-workout-plans-v2")!) as WorkoutPlan[];
    const bad = saved.find((p) => p.id === "bad")!;
    expect(bad.bestResult).toBeUndefined();
    expect(bad.lastResult).toBeUndefined();
  });
});
