"use client";

import { useSyncExternalStore } from "react";
import { formatDuration, formatResult, isBetterResult, type PlanFormat, type WorkoutPlan } from "./store";

export type SessionStatus = "completed" | "timeUp" | "aborted";

export interface WorkoutSession {
  id: string;
  planId: string;
  /** snapshot – plan may be renamed/deleted later */
  planName: string;
  format: PlanFormat;
  /** ms epoch */
  startedAt: number;
  /** ms epoch */
  endedAt: number;
  /** seconds the clock actually ran (pauses excluded) */
  duration: number;
  status: SessionStatus;
  /** work steps reached (each side of a unilateral exercise counts as one set) */
  sets: number;
  /** fully finished rounds (tracked) */
  rounds: number;
  /** rounds plans only */
  roundsPlanned?: number;
  /** AMRAP only */
  timeCap?: number;
  /** AMRAP only – final result, possibly corrected by the user */
  result?: { rounds: number; extra: number };
  /** AMRAP only – result as counted from the user's taps (absent in older entries) */
  tracked?: { rounds: number; extra: number };
  /** AMRAP only – true while `result` differs from the tracked result */
  edited?: boolean;
}

const KEY = "kb-workout-history-v1";
export const MAX_SESSIONS = 1000;
let cache: WorkoutSession[] | null = null;
const listeners = new Set<() => void>();

const isNum = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n);
const isResult = (r: unknown): r is { rounds: number; extra: number } =>
  !!r && typeof r === "object" && isNum((r as { rounds?: unknown }).rounds) && isNum((r as { extra?: unknown }).extra);

/** Returns a clean session, or null when a required field is broken. Invalid optional fields are dropped. */
const sanitize = (s: unknown): WorkoutSession | null => {
  const x = s as Partial<WorkoutSession> | null;
  if (
    !x ||
    typeof x !== "object" ||
    typeof x.id !== "string" ||
    typeof x.planId !== "string" ||
    typeof x.planName !== "string" ||
    (x.format !== "rounds" && x.format !== "amrap") ||
    !isNum(x.startedAt) ||
    !isNum(x.endedAt) ||
    !isNum(x.duration) ||
    !isNum(x.sets) ||
    !isNum(x.rounds)
  ) {
    return null;
  }
  const clean: WorkoutSession = { ...x } as WorkoutSession;
  if (!isNum(x.roundsPlanned)) delete clean.roundsPlanned;
  if (!isNum(x.timeCap)) delete clean.timeCap;
  if (!isResult(x.result)) delete clean.result;
  if (!isResult(x.tracked)) delete clean.tracked;
  if (typeof x.edited !== "boolean") delete clean.edited;
  return clean;
};

function read(): WorkoutSession[] {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    cache = Array.isArray(parsed) ? parsed.map(sanitize).filter((s): s is WorkoutSession => s !== null) : [];
  } catch {
    cache = [];
  }
  return cache;
}

/**
 * Re-reads localStorage before a mutation, so changes made in another tab are not overwritten
 * by a stale cache. Falls back to the in-memory cache when storage is unavailable.
 */
function fresh(): WorkoutSession[] {
  try {
    window.localStorage.getItem(KEY);
    cache = null;
  } catch {
    /* storage unavailable – keep the in-memory cache */
  }
  return read();
}

function write(sessions: WorkoutSession[]) {
  cache = sessions.slice(-MAX_SESSIONS);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(cache));
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
export function useHistory(): WorkoutSession[] | null {
  return useSyncExternalStore(subscribe, read, () => null);
}

export function getHistory(): WorkoutSession[] {
  return read();
}

/** Idempotent per id: an existing session with the same id is replaced. */
export function addSession(s: WorkoutSession) {
  const all = fresh();
  write(all.some((x) => x.id === s.id) ? all.map((x) => (x.id === s.id ? s : x)) : [...all, s]);
}

export function updateSessionResult(id: string, result: { rounds: number; extra: number }) {
  write(
    fresh().map((s) => {
      if (s.id !== id) return s;
      // without a tracked baseline (older entries) any change counts as an edit
      const edited = s.tracked ? s.tracked.rounds !== result.rounds || s.tracked.extra !== result.extra : true;
      return { ...s, result, rounds: result.rounds, edited };
    }),
  );
}

export function deleteSession(id: string) {
  write(fresh().filter((s) => s.id !== id));
}

export function bestResultFor(plan: WorkoutPlan, sessions: WorkoutSession[], excludeId?: string) {
  let best: { rounds: number; extra: number } | undefined = plan.bestResult
    ? { rounds: plan.bestResult.rounds, extra: plan.bestResult.extra }
    : undefined;
  for (const s of sessions) {
    if (s.planId !== plan.id || s.status === "aborted" || !s.result || s.id === excludeId) continue;
    if (isBetterResult(s.result, best)) best = { rounds: s.result.rounds, extra: s.result.extra };
  }
  return best;
}

/**
 * "N× completed" / "last completed" derived from the history. Legacy counters stored on the plan
 * (from before the history existed) are frozen – nothing writes them anymore – and the number of
 * non-aborted sessions is added, so deleting history entries is reflected correctly.
 */
export function completionStatsFor(plan: WorkoutPlan, sessions: WorkoutSession[]) {
  let count = plan.timesCompleted ?? 0;
  let last = plan.lastCompletedAt;
  for (const s of sessions) {
    if (s.planId !== plan.id || s.status === "aborted") continue;
    count++;
    if (last === undefined || s.endedAt > last) last = s.endedAt;
  }
  return { count, last };
}

export function formatSessionSummary(s: WorkoutSession): string {
  if (s.format === "amrap") {
    const result = s.result ?? { rounds: s.rounds, extra: 0 };
    // an aborted session did not run until the cap
    const time = s.status === "aborted" ? s.duration : (s.timeCap ?? s.duration);
    return `${formatResult(result)} · ${s.sets} sets · ${formatDuration(time)}`;
  }
  return `${s.rounds}/${s.roundsPlanned ?? s.rounds} rounds · ${s.sets} sets · ${formatDuration(s.duration)}`;
}

const dayKey = (ms: number) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export function groupByDay(sessions: WorkoutSession[], now = Date.now()) {
  const sorted = [...sessions].sort((a, b) => b.endedAt - a.endedAt);
  const today = dayKey(now);
  const y = new Date(now);
  y.setDate(y.getDate() - 1);
  const yesterday = dayKey(y.getTime());
  const groups: { day: string; label: string; items: WorkoutSession[] }[] = [];
  for (const s of sorted) {
    const day = dayKey(s.endedAt);
    let g = groups[groups.length - 1];
    if (!g || g.day !== day) {
      const label =
        day === today
          ? "Today"
          : day === yesterday
            ? "Yesterday"
            : new Date(s.endedAt).toLocaleDateString("en-GB", {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
              });
      g = { day, label, items: [] };
      groups.push(g);
    }
    g.items.push(s);
  }
  return groups;
}
