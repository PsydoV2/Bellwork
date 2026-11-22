"use client";

import { useSyncExternalStore } from "react";
import { getExercise } from "./exercises";

export interface WorkoutItem {
  id: string;
  exerciseId: string;
  mode: "reps" | "time";
  reps: number;
  /** seconds */
  duration: number;
  /** kg */
  weight: number;
  /** seconds of rest after this exercise */
  rest: number;
}

/**
 * "rounds": a fixed number of rounds, resting after every exercise.
 * "amrap": "as many rounds as possible" – the circuit repeats back-to-back until the time cap is
 * reached; the only rest is a short break each time the circuit starts over.
 */
export type PlanFormat = "rounds" | "amrap";

export interface AmrapResult {
  rounds: number;
  /** exercises finished in the incomplete last round */
  extra: number;
  at: number;
}

export interface WorkoutPlan {
  id: string;
  name: string;
  format?: PlanFormat;
  rounds: number;
  /** seconds between rounds */
  roundRest: number;
  /** AMRAP only: total workout time in seconds */
  timeCap?: number;
  items: WorkoutItem[];
  createdAt: number;
  /** legacy (pre-history), frozen – completions now come from history.ts (completionStatsFor) */
  lastCompletedAt?: number;
  /** legacy (pre-history), frozen – completions now come from history.ts (completionStatsFor) */
  timesCompleted?: number;
  /** legacy (pre-history) – results now live in history.ts */
  lastResult?: AmrapResult;
  /** legacy (pre-history) – results now live in history.ts */
  bestResult?: AmrapResult;
}

export const isAmrap = (p: WorkoutPlan) => p.format === "amrap";
export const DEFAULT_TIME_CAP = 15 * 60;

/** Upper bound of generated rounds for AMRAP plans – the time cap ends the workout long before. */
export const AMRAP_MAX_ROUNDS = 200;

export function formatResult(r: Pick<AmrapResult, "rounds" | "extra">): string {
  return `${r.rounds} round${r.rounds === 1 ? "" : "s"}${r.extra ? ` + ${r.extra}` : ""}`;
}

export const isBetterResult = (a: Pick<AmrapResult, "rounds" | "extra">, b?: Pick<AmrapResult, "rounds" | "extra">) =>
  !b || a.rounds > b.rounds || (a.rounds === b.rounds && a.extra > b.extra);

/** Assumed seconds per repetition, used for time estimates. */
export const SECONDS_PER_REP = 3;

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function newItem(exerciseId: string): WorkoutItem {
  const ex = getExercise(exerciseId);
  return {
    id: uid(),
    exerciseId,
    mode: ex.defaultMode ?? "reps",
    reps: ex.defaultReps,
    duration: 40,
    weight: 12,
    rest: 30,
  };
}

export function newPlan(): WorkoutPlan {
  return { id: uid(), name: "", rounds: 3, roundRest: 60, items: [], createdAt: Date.now() };
}

export function estimateSeconds(plan: WorkoutPlan): number {
  if (plan.items.length === 0) return 0;
  if (isAmrap(plan)) return (plan.timeCap ?? DEFAULT_TIME_CAP) + 10;
  let perRound = 0;
  plan.items.forEach((it) => {
    const sides = getExercise(it.exerciseId).unilateral ? 2 : 1;
    const work = it.mode === "time" ? it.duration : it.reps * SECONDS_PER_REP;
    perRound += work * sides + it.rest;
  });
  return perRound * plan.rounds + plan.roundRest * Math.max(0, plan.rounds - 1) + 10;
}

const item = (exerciseId: string, o: Partial<WorkoutItem>): WorkoutItem => ({
  ...newItem(exerciseId),
  ...o,
});

function defaultPlans(): WorkoutPlan[] {
  return [
    {
      id: "starter",
      name: "Beginner Full Body",
      rounds: 3,
      roundRest: 60,
      createdAt: 1,
      items: [
        item("deadlift", { id: "s1", reps: 10, weight: 16, rest: 20 }),
        item("goblet-squat", { id: "s2", reps: 10, weight: 12, rest: 20 }),
        item("row", { id: "s3", reps: 8, weight: 12, rest: 20 }),
        item("press", { id: "s4", reps: 6, weight: 8, rest: 20 }),
        item("swing", { id: "s5", mode: "time", duration: 30, weight: 16, rest: 30 }),
      ],
    },
    {
      id: "swing-hiit",
      name: "Swing HIIT – 15 Minutes",
      rounds: 5,
      roundRest: 45,
      createdAt: 2,
      items: [
        item("swing", { id: "h1", mode: "time", duration: 40, weight: 16, rest: 20 }),
        item("goblet-squat", { id: "h2", mode: "time", duration: 40, weight: 16, rest: 20 }),
        item("high-pull", { id: "h3", mode: "time", duration: 30, weight: 12, rest: 20 }),
      ],
    },
    {
      id: "strength",
      name: "Strength & Power",
      rounds: 4,
      roundRest: 90,
      createdAt: 3,
      items: [
        item("clean-press", { id: "k1", reps: 5, weight: 16, rest: 30 }),
        item("reverse-lunge", { id: "k2", reps: 8, weight: 16, rest: 30 }),
        item("single-leg-deadlift", { id: "k3", reps: 6, weight: 12, rest: 30 }),
        item("thruster", { id: "k4", reps: 8, weight: 12, rest: 30 }),
        item("snatch", { id: "k5", reps: 5, weight: 12, rest: 45 }),
      ],
    },
    {
      id: "core",
      name: "Core & Arms",
      rounds: 3,
      roundRest: 60,
      createdAt: 4,
      items: [
        item("halo", { id: "c1", reps: 10, weight: 8, rest: 15 }),
        item("woodchop", { id: "c2", reps: 8, weight: 8, rest: 15 }),
        item("straddle-pass", { id: "c3", reps: 10, weight: 8, rest: 15 }),
        item("pullover", { id: "c4", reps: 10, weight: 12, rest: 15 }),
        item("curl-press", { id: "c5", reps: 10, weight: 8, rest: 15 }),
        item("triceps-extension", { id: "c6", reps: 12, weight: 8, rest: 30 }),
      ],
    },
    {
      id: "amrap-20",
      name: "20-Minute AMRAP",
      format: "amrap",
      rounds: 1,
      roundRest: 30,
      timeCap: 20 * 60,
      createdAt: 5,
      items: [
        item("swing", { id: "a1", reps: 15, weight: 16, rest: 0 }),
        item("goblet-squat", { id: "a2", reps: 10, weight: 16, rest: 0 }),
        item("row-two-hand", { id: "a3", reps: 10, weight: 16, rest: 0 }),
        item("push-press", { id: "a4", reps: 5, weight: 12, rest: 0 }),
        item("farmers-carry", { id: "a5", mode: "time", duration: 30, weight: 16, rest: 0 }),
      ],
    },
  ];
}

const KEY = "kb-workout-plans-v2";
/** Ids of built-in plans already offered to this browser – new built-ins get added once. */
const SEEDED_KEY = "kb-workout-seeded";
const ORIGINAL_SEEDS = ["starter", "swing-hiit", "strength", "core"];
let cache: WorkoutPlan[] | null = null;
const listeners = new Set<() => void>();

/** Drops results from the old AMRAP bug (all 200 pre-generated rounds were counted). */
export function sanitizePlans(plans: WorkoutPlan[]): { plans: WorkoutPlan[]; changed: boolean } {
  let changed = false;
  const bad = (r?: AmrapResult) => !!r && r.rounds >= AMRAP_MAX_ROUNDS;
  const out = plans.map((p) => {
    if (!bad(p.lastResult) && !bad(p.bestResult)) return p;
    changed = true;
    const next = { ...p };
    if (bad(p.lastResult)) delete next.lastResult;
    if (bad(p.bestResult)) delete next.bestResult;
    return next;
  });
  return { plans: out, changed };
}

function read(): WorkoutPlan[] {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    const seededRaw = window.localStorage.getItem(SEEDED_KEY);
    const seeded: string[] = seededRaw ? JSON.parse(seededRaw) : raw ? ORIGINAL_SEEDS : [];
    const defaults = defaultPlans();
    const missing = defaults.filter((p) => !seeded.includes(p.id));
    const parsed = raw ? (JSON.parse(raw) as WorkoutPlan[]) : [];
    const { plans, changed } = sanitizePlans(parsed);
    cache = [...plans, ...missing];
    if (missing.length || changed) {
      window.localStorage.setItem(KEY, JSON.stringify(cache));
      if (missing.length) window.localStorage.setItem(SEEDED_KEY, JSON.stringify(defaults.map((p) => p.id)));
    }
  } catch {
    cache = defaultPlans();
  }
  return cache;
}

function write(plans: WorkoutPlan[]) {
  cache = plans;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(plans));
  } catch {
    /* storage unavailable – keep in memory */
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

/** Returns null during server rendering / hydration. */
export function usePlans(): WorkoutPlan[] | null {
  return useSyncExternalStore(subscribe, read, () => null);
}

export function upsertPlan(plan: WorkoutPlan) {
  const plans = read();
  const exists = plans.some((p) => p.id === plan.id);
  write(exists ? plans.map((p) => (p.id === plan.id ? plan : p)) : [...plans, plan]);
}

export function getPlans(): WorkoutPlan[] {
  return read();
}

export function addPlans(plans: WorkoutPlan[]) {
  if (plans.length) write([...read(), ...plans]);
}

export function deletePlan(id: string) {
  write(read().filter((p) => p.id !== id));
}

export function duplicatePlan(id: string) {
  const src = read().find((p) => p.id === id);
  if (!src) return;
  const copy: WorkoutPlan = {
    ...src,
    id: uid(),
    name: `${src.name} (copy)`,
    createdAt: Date.now(),
    lastCompletedAt: undefined,
    timesCompleted: 0,
    lastResult: undefined,
    bestResult: undefined,
    items: src.items.map((i) => ({ ...i, id: uid() })),
  };
  write([...read(), copy]);
}

export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}
