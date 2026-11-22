import { describe, expect, it } from "vitest";
import { AMRAP_MAX_ROUNDS, newItem, type WorkoutPlan } from "./store";
import { buildSteps, initialState, makeReducer, summarize } from "./workout";

const amrapPlan = (): WorkoutPlan => {
  const ids = ["swing", "goblet-squat", "row-two-hand", "push-press", "farmers-carry"];
  const items = ids.map((id, n) => ({
    ...newItem(id),
    id: `i${n}`,
    rest: 0,
    ...(id === "farmers-carry" ? { mode: "time" as const, duration: 30 } : { mode: "reps" as const }),
  }));
  return { id: "p", name: "AMRAP", format: "amrap", rounds: 1, roundRest: 30, timeCap: 60, items, createdAt: 1 };
};

describe("AMRAP time-up", () => {
  it("counts real progress instead of the pre-generated rounds (regression: 200 rounds / 1200 sets)", () => {
    const plan = amrapPlan();
    const steps = buildSteps(plan);
    const reducer = makeReducer(steps, 60);
    let s = initialState(steps);
    const target = steps.findIndex((st) => st.kind === "work" && st.round === 6 && st.item.id === plan.items[2].id);
    expect(target).toBeGreaterThan(0);
    s = reducer(s, { type: "goto", index: target });
    s = reducer(s, { type: "tick", dt: 61 });
    expect(s.timeUp).toBe(true);
    expect(s.index).toBe(steps.length);
    expect(s.stopIndex).toBe(target);
    const sum = summarize(steps, s, 5);
    expect(sum).toEqual({ rounds: 5, extra: 2, sets: 5 * 6 + 2 });
    expect(sum.rounds).not.toBe(200);
  });

  it("ignores goto after time is up", () => {
    const steps = buildSteps(amrapPlan());
    const reducer = makeReducer(steps, 60);
    let s = reducer(initialState(steps), { type: "goto", index: 3 });
    s = reducer(s, { type: "tick", dt: 61 });
    expect(reducer(s, { type: "goto", index: 0 })).toBe(s);
  });

  it("does not count the prepare step against the cap", () => {
    const steps = buildSteps(amrapPlan());
    const reducer = makeReducer(steps, 60);
    const s = reducer(initialState(steps), { type: "tick", dt: 5 });
    expect(s.capElapsed).toBe(0);
    expect(s.timeUp).toBe(false);
  });

  it("pre-generates AMRAP_MAX_ROUNDS rounds (why stopIndex is needed)", () => {
    const steps = buildSteps(amrapPlan());
    const lastRound = Math.max(...steps.flatMap((st) => (st.kind === "work" ? [st.round] : [])));
    expect(lastRound).toBe(AMRAP_MAX_ROUNDS);
  });
});

describe("rounds plan", () => {
  it("summarizes a regular finish", () => {
    const plan: WorkoutPlan = {
      id: "r",
      name: "R",
      rounds: 3,
      roundRest: 10,
      createdAt: 1,
      items: [
        { ...newItem("swing"), id: "a", rest: 10 },
        { ...newItem("push-press"), id: "b", rest: 10 },
      ],
    };
    const steps = buildSteps(plan);
    const reducer = makeReducer(steps, 0);
    const s = reducer(initialState(steps), { type: "goto", index: steps.length });
    expect(s.stopIndex).toBeNull();
    expect(summarize(steps, s, 2)).toEqual({ rounds: 3, extra: 0, sets: 9 });
  });

  it("summarizes an abort in the middle of a round", () => {
    const plan: WorkoutPlan = {
      id: "r",
      name: "R",
      rounds: 3,
      roundRest: 10,
      createdAt: 1,
      items: [
        { ...newItem("swing"), id: "a", rest: 10 },
        { ...newItem("push-press"), id: "b", rest: 10 },
      ],
    };
    const steps = buildSteps(plan);
    const reducer = makeReducer(steps, 0);
    const idx = steps.findIndex((st) => st.kind === "work" && st.round === 2 && st.item.id === "b" && st.side === "right");
    const s = reducer(initialState(steps), { type: "goto", index: idx });
    expect(s.stopIndex).toBeNull();
    expect(summarize(steps, s, 2)).toEqual({ rounds: 1, extra: 1, sets: 4 });
  });
});

const timePlan = (): WorkoutPlan => ({
  id: "t",
  name: "T",
  format: "amrap",
  rounds: 1,
  roundRest: 0,
  timeCap: 60,
  createdAt: 1,
  items: ["swing", "goblet-squat"].map((id, n) => ({ ...newItem(id), id: `t${n}`, rest: 0, mode: "time" as const, duration: 30 })),
});

const repsPlan = (ids: string[], cap = 20): WorkoutPlan => ({
  id: "q",
  name: "Q",
  format: "amrap",
  rounds: 1,
  roundRest: 30,
  timeCap: cap,
  createdAt: 1,
  items: ids.map((id, n) => ({ ...newItem(id), id: `q${n}`, rest: 0, mode: "reps" as const })),
});

describe("AMRAP time-up positions", () => {
  it("a time-up during the pause after a finished round keeps the round", () => {
    const steps = buildSteps(repsPlan(["swing", "goblet-squat"]));
    const reducer = makeReducer(steps, 20);
    const restIdx = steps.findIndex((st) => st.kind === "rest");
    let s = reducer(initialState(steps), { type: "goto", index: restIdx });
    s = reducer(s, { type: "tick", dt: 21 });
    expect(s.timeUp).toBe(true);
    expect(summarize(steps, s, 2)).toEqual({ rounds: 1, extra: 0, sets: 2 });
  });

  it("a time-up in the very first work step yields 0 / 0 / 0", () => {
    const steps = buildSteps(repsPlan(["swing", "goblet-squat"]));
    const reducer = makeReducer(steps, 20);
    let s = reducer(initialState(steps), { type: "goto", index: 1 });
    s = reducer(s, { type: "tick", dt: 21 });
    expect(summarize(steps, s, 2)).toEqual({ rounds: 0, extra: 0, sets: 0 });
  });

  it("a time-up between the right and left side counts one set but not the exercise", () => {
    const steps = buildSteps(repsPlan(["swing", "push-press"]));
    const reducer = makeReducer(steps, 20);
    const left = steps.findIndex((st) => st.kind === "work" && st.side === "left");
    let s = reducer(initialState(steps), { type: "goto", index: left });
    s = reducer(s, { type: "tick", dt: 21 });
    // swing finished (extra 1), push-press only has its right side done
    expect(summarize(steps, s, 2)).toEqual({ rounds: 0, extra: 1, sets: 2 });
  });

  it("skipping with goto(index + 1) counts the skipped step as done", () => {
    const steps = buildSteps(repsPlan(["swing", "goblet-squat"]));
    const reducer = makeReducer(steps, 20);
    let s = reducer(initialState(steps), { type: "goto", index: 1 });
    s = reducer(s, { type: "goto", index: 2 });
    s = reducer(s, { type: "tick", dt: 21 });
    expect(summarize(steps, s, 2)).toEqual({ rounds: 0, extra: 1, sets: 1 });
  });
});

describe("timed steps and the cap", () => {
  const run = (dt: number) => {
    const steps = buildSteps(timePlan());
    const reducer = makeReducer(steps, 60);
    let s = initialState(steps);
    for (let i = 0; i < 5000 && !s.timeUp; i++) s = reducer(s, { type: "tick", dt });
    return { steps, s };
  };

  it("counts a timed step that ends in the same tick as the cap (regression)", () => {
    for (const dt of [0.25, 0.2, 0.1]) {
      const { steps, s } = run(dt);
      expect(s.timeUp).toBe(true);
      expect(summarize(steps, s, 2)).toEqual({ rounds: 1, extra: 0, sets: 2 });
    }
  });

  it("carries the overshoot into the next timed step (no drift)", () => {
    const steps = buildSteps(timePlan());
    const reducer = makeReducer(steps, 0);
    let s = initialState(steps);
    s = reducer(s, { type: "tick", dt: 4.7 });
    s = reducer(s, { type: "tick", dt: 5.8 });
    expect(s.index).toBe(1);
    expect(s.remaining).toBeCloseTo(29.5);
  });

  it("does not carry an overshoot into steps without a duration", () => {
    const plan = timePlan();
    plan.items[1] = { ...plan.items[1], mode: "reps" };
    const steps = buildSteps(plan);
    const reducer = makeReducer(steps, 0);
    let s = reducer(initialState(steps), { type: "tick", dt: 10 });
    s = reducer(s, { type: "tick", dt: 33 });
    expect(s.index).toBe(2);
    expect(s.remaining).toBe(0);
  });

  it("drops a large overshoot (background throttling) instead of skipping steps", () => {
    const plan: WorkoutPlan = { ...timePlan(), format: "rounds", rounds: 3, timeCap: undefined };
    const steps = buildSteps(plan);
    const reducer = makeReducer(steps, 0);
    let s = reducer(initialState(steps), { type: "tick", dt: 10 });
    s = reducer(s, { type: "tick", dt: 300 });
    expect(s.index).toBe(2);
    expect(s.remaining).toBeCloseTo(30);
    s = reducer(s, { type: "tick", dt: 0.2 });
    expect(s.index).toBe(2);
    expect(s.remaining).toBeCloseTo(29.8);
  });

  it("never yields a negative remaining", () => {
    const steps = buildSteps(timePlan());
    const reducer = makeReducer(steps, 0);
    let s = initialState(steps);
    for (const dt of [300, 0.2, 0.9, 1.0, 45, 0.2]) {
      s = reducer(s, { type: "tick", dt });
      expect(s.remaining).toBeGreaterThanOrEqual(0);
    }
  });

  it("counts the get-ready overshoot against the cap when it shortens the first step", () => {
    const steps = buildSteps(timePlan());
    const reducer = makeReducer(steps, 60);
    let s = reducer(initialState(steps), { type: "tick", dt: 10.5 });
    expect(s.index).toBe(1);
    expect(s.remaining).toBeCloseTo(29.5);
    expect(s.capElapsed).toBeCloseTo(0.5);
    s = reducer(s, { type: "tick", dt: 29.5 });
    expect(s.index).toBe(2);
    expect(s.capElapsed).toBeCloseTo(30);
    expect(s.remaining).toBeCloseTo(30);
  });

  it("ignores ticks while paused", () => {
    const steps = buildSteps(timePlan());
    const reducer = makeReducer(steps, 60);
    let s = reducer(initialState(steps), { type: "tick", dt: 4 });
    s = reducer(s, { type: "toggle" });
    const paused = reducer(s, { type: "tick", dt: 100 });
    expect(paused).toBe(s);
    s = reducer(paused, { type: "toggle" });
    s = reducer(s, { type: "tick", dt: 1 });
    expect(s.remaining).toBeCloseTo(5);
  });
});
