"use client";

import { getExercise, type Exercise } from "./exercises";
import { AMRAP_MAX_ROUNDS, isAmrap, type WorkoutItem, type WorkoutPlan } from "./store";

export type Side = "right" | "left";
export type Step =
  | { kind: "prepare"; duration: number; next: Exercise; nextSide?: Side }
  | {
      kind: "work";
      exercise: Exercise;
      item: WorkoutItem;
      side?: Side;
      round: number;
      duration?: number;
      /** true on the last side of the exercise – the exercise is finished after this step */
      itemDone: boolean;
    }
  | { kind: "rest"; duration: number; round: number; next: Exercise; nextSide?: Side; roundBreak: boolean };

export function buildSteps(plan: WorkoutPlan): Step[] {
  const steps: Step[] = [];
  if (plan.items.length === 0) return steps;
  const amrap = isAmrap(plan);
  const rounds = amrap ? AMRAP_MAX_ROUNDS : plan.rounds;
  const first = getExercise(plan.items[0].exerciseId);
  steps.push({ kind: "prepare", duration: 10, next: first, nextSide: first.unilateral ? "right" : undefined });
  for (let r = 1; r <= rounds; r++) {
    plan.items.forEach((item, i) => {
      const exercise = getExercise(item.exerciseId);
      const duration = item.mode === "time" ? item.duration : undefined;
      const sides: (Side | undefined)[] = exercise.unilateral ? ["right", "left"] : [undefined];
      sides.forEach((side, si) =>
        steps.push({ kind: "work", exercise, item, side, round: r, duration, itemDone: si === sides.length - 1 }),
      );
      const lastInRound = i === plan.items.length - 1;
      if (lastInRound && r === rounds) return;
      const nextItem = lastInRound ? plan.items[0] : plan.items[i + 1];
      const next = getExercise(nextItem.exerciseId);
      // AMRAP: straight from one exercise into the next, a short break only when the circuit starts over
      const rest = amrap ? (lastInRound ? plan.roundRest : 0) : lastInRound ? item.rest + plan.roundRest : item.rest;
      if (rest > 0) {
        steps.push({
          kind: "rest",
          duration: rest,
          round: r,
          next,
          nextSide: next.unilateral ? "right" : undefined,
          roundBreak: lastInRound,
        });
      }
    });
  }
  return steps;
}

export interface WorkoutState {
  index: number;
  remaining: number;
  stepElapsed: number;
  total: number;
  /** seconds counted against the AMRAP time cap (excludes the get-ready countdown) */
  capElapsed: number;
  timeUp: boolean;
  running: boolean;
  /** AMRAP: step index the user was on when the time cap ran out */
  stopIndex: number | null;
}

export type WorkoutAction = { type: "tick"; dt: number } | { type: "goto"; index: number } | { type: "toggle" };

export function initialState(steps: Step[]): WorkoutState {
  return {
    index: 0,
    remaining: steps[0] && "duration" in steps[0] ? (steps[0].duration ?? 0) : 0,
    stepElapsed: 0,
    total: 0,
    capElapsed: 0,
    timeUp: false,
    running: true,
    stopIndex: null,
  };
}

/** tolerance for floating point drift when summing tick lengths */
const EPS = 1e-6;

export function makeReducer(steps: Step[], cap: number) {
  const durationOf = (i: number) => {
    const s = steps[i];
    return s && "duration" in s && s.duration ? s.duration : 0;
  };
  return (state: WorkoutState, action: WorkoutAction): WorkoutState => {
    switch (action.type) {
      case "toggle":
        return { ...state, running: !state.running };
      case "goto": {
        if (state.timeUp) return state;
        const index = Math.max(0, Math.min(steps.length, action.index));
        return { ...state, index, remaining: durationOf(index), stepElapsed: 0 };
      }
      case "tick": {
        if (!state.running || state.index >= steps.length) return state;
        const total = state.total + action.dt;
        const stepElapsed = state.stepElapsed + action.dt;
        const counting = cap > 0 && steps[state.index].kind !== "prepare";
        const capElapsed = state.capElapsed + (counting ? action.dt : 0);
        const timed = durationOf(state.index) > 0;
        const remaining = state.remaining - action.dt;
        // a timed step that runs out in the very same tick as the cap still counts as finished
        const stepDone = timed && remaining <= EPS;
        if (counting && capElapsed >= cap - EPS) {
          const stopIndex = stepDone ? state.index + 1 : state.index;
          return { ...state, total, capElapsed: cap, stopIndex, index: steps.length, remaining: 0, timeUp: true };
        }
        if (stepDone) {
          const index = state.index + 1;
          const next = durationOf(index);
          // carry only small tick/float drift into the next timed step so steps do not drift against the cap.
          // A large overshoot (background throttling) is dropped, so the next step starts in full.
          const carry = remaining >= -1 ? Math.min(0, remaining) : 0;
          // the overshoot of the get-ready countdown eats into the next step, so it counts against the cap too
          const carriedCap = cap > 0 && !counting && next > 0 ? -carry : 0;
          return {
            ...state,
            total,
            capElapsed: capElapsed + carriedCap,
            index,
            remaining: next > 0 ? Math.max(0, next + carry) : 0,
            stepElapsed: 0,
          };
        }
        if (timed) return { ...state, total, capElapsed, remaining, stepElapsed };
        return { ...state, total, capElapsed, stepElapsed };
      }
    }
  };
}

/** Progress up to (excluding) the step the workout ended on. */
export function summarize(steps: Step[], state: WorkoutState, itemsPerRound: number) {
  const end = state.stopIndex ?? state.index;
  const done = steps.slice(0, end);
  const doneItems = done.filter((s) => s.kind === "work" && s.itemDone).length;
  const perRound = Math.max(1, itemsPerRound);
  return {
    rounds: Math.floor(doneItems / perRound),
    extra: doneItems % perRound,
    sets: done.filter((s) => s.kind === "work").length,
  };
}
