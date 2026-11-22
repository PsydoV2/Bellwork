"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { usesTwoBells } from "@/lib/exercises";
import {
  DEFAULT_TIME_CAP,
  formatDuration,
  formatResult,
  isAmrap,
  isBetterResult,
  uid,
  type WorkoutPlan,
} from "@/lib/store";
import {
  addSession,
  bestResultFor,
  updateSessionResult,
  useHistory,
  type SessionStatus,
  type WorkoutSession,
} from "@/lib/history";
import { buildSteps, initialState, makeReducer, summarize, type Side, type Step } from "@/lib/workout";
import { beep, speak, unlockAudio } from "@/lib/audio";
import { ExerciseAnimation } from "./ExerciseAnimation";
import { Icon } from "./ui";

function Ring({
  progress,
  color,
  children,
  className = "h-32 w-32 sm:h-40 sm:w-40",
}: {
  progress: number;
  color: string;
  children: React.ReactNode;
  className?: string;
}) {
  const r = 54;
  const c = 2 * Math.PI * r;
  return (
    <div className={`relative shrink-0 ${className}`}>
      <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" className="stroke-surface-2" strokeWidth="8" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.max(0, Math.min(1, progress)))}
          style={{ transition: "stroke-dashoffset 0.25s linear" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || typeof navigator === "undefined" || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;
    const request = () =>
      navigator.wakeLock
        .request("screen")
        .then((l) => {
          if (cancelled) void l.release();
          else lock = l;
        })
        .catch(() => {});
    void request();
    const onVis = () => document.visibilityState === "visible" && void request();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVis);
      void lock?.release();
    };
  }, [active]);
}

const MAX_ROUNDS_EDIT = 999;

const sideLabel = (s?: Side) => (s ? (s === "right" ? "Right side" : "Left side") : "");

export function WorkoutPlayer({ plan, onExit }: { plan: WorkoutPlan; onExit: () => void }) {
  const amrap = isAmrap(plan);
  const cap = amrap ? (plan.timeCap ?? DEFAULT_TIME_CAP) : 0;
  const steps = useMemo(() => buildSteps(plan), [plan]);
  const reducer = useMemo(() => makeReducer(steps, cap), [steps, cap]);
  const [state, dispatch] = useReducer(reducer, steps, initialState);
  const history = useHistory();
  /** AMRAP: result as corrected by the user on the summary screen */
  const [final, setFinal] = useState<{ rounds: number; extra: number } | null>(null);
  const startedAt = useRef(0);
  const [sessionId] = useState(() => uid());
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);
  const [sound, setSound] = useState(true);
  const [confirmExit, setConfirmExit] = useState(false);
  /** phone only: technique cues shown as an overlay on the animation */
  const [showCues, setShowCues] = useState(false);
  /** 0 = all camera views, 1/2 = only the first/second view (bigger figure on phones) */
  const [viewMode, setViewMode] = useState(0);
  const finished = state.index >= steps.length;
  const step = steps[state.index] as Step | undefined;

  useWakeLock(!finished);

  useEffect(() => {
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      dispatch({ type: "tick", dt: (now - last) / 1000 });
      last = now;
    }, 200);
    return () => window.clearInterval(id);
  }, []);

  const summary = summarize(steps, state, plan.items.length);
  const tracked = { rounds: summary.rounds, extra: summary.extra };
  const buildSession = (status: SessionStatus): WorkoutSession => ({
    id: sessionId,
    planId: plan.id,
    planName: plan.name || "Untitled workout",
    format: amrap ? "amrap" : "rounds",
    startedAt: startedAt.current || Date.now(),
    endedAt: Date.now(),
    duration: state.total,
    status,
    sets: summary.sets,
    rounds: amrap || status === "aborted" ? summary.rounds : plan.rounds,
    roundsPlanned: amrap ? undefined : plan.rounds,
    timeCap: amrap ? cap : undefined,
    result: amrap ? tracked : undefined,
    tracked: amrap ? tracked : undefined,
  });
  const capSecLeft = Math.ceil(cap - state.capElapsed);

  const secLeft = Math.ceil(state.remaining);
  const timed = !!step && "duration" in step && !!step.duration;
  useEffect(() => {
    if (!sound || !state.running || !timed) return;
    if (secLeft >= 1 && secLeft <= 3) beep(660, 110);
  }, [secLeft, sound, state.running, timed]);
  useEffect(() => {
    if (!sound || !state.running || !cap || finished) return;
    if (capSecLeft >= 1 && capSecLeft <= 3) beep(880, 110);
  }, [capSecLeft, cap, sound, state.running, finished]);

  const announced = useRef(-1);
  useEffect(() => {
    if (announced.current === state.index) return;
    announced.current = state.index;
    if (!sound) return;
    if (finished) {
      beep(880, 180);
      setTimeout(() => beep(1175, 300), 200);
      speak(state.timeUp ? `Time! ${formatResult(tracked)}.` : "Done! Great workout.");
      return;
    }
    if (!step) return;
    if (step.kind === "work") {
      beep(1046, 280, 0.3);
      const amount = step.item.mode === "time" ? `${step.item.duration} seconds` : `${step.item.reps} reps`;
      speak(`${step.exercise.name}${step.side ? `, ${step.side} side` : ""}. ${amount}.`);
    } else if (step.kind === "rest") {
      beep(523, 280, 0.3);
      speak(`Rest. Next up: ${step.next.name}`);
    } else {
      speak(`Get ready. First exercise: ${step.next.name}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- announce once per step
  }, [state.index, finished, step, sound]);

  const completed = useRef(false);
  useEffect(() => {
    if (finished && !completed.current) {
      completed.current = true;
      addSession(buildSession(state.timeUp ? "timeUp" : "completed"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- record the result at the moment the workout ends
  }, [finished, plan.id, amrap]);

  const goto = (i: number) => dispatch({ type: "goto", index: i });
  const workSteps = steps.filter((s) => s.kind === "work").length;
  const doneWork = summary.sets;

  if (finished) {
    const shown = final ?? tracked;
    const prevBest = history ? bestResultFor(plan, history, sessionId) : plan.bestResult;
    const newBest = amrap && (shown.rounds > 0 || shown.extra > 0) && isBetterResult(shown, prevBest);
    const change = (r: { rounds: number; extra: number }) => {
      setFinal(r);
      updateSessionResult(sessionId, r);
    };
    const maxExtra = Math.max(0, plan.items.length - 1);
    const stats: [string, string][] = amrap
      ? [
          ["Time", formatDuration(cap)],
          ["Rounds", `${shown.rounds}${shown.extra ? ` + ${shown.extra}` : ""}`],
          ["Sets", String(summary.sets)],
        ]
      : [
          ["Time", formatDuration(state.total)],
          ["Rounds", String(plan.rounds)],
          ["Sets", String(summary.sets)],
        ];
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center animate-fade-up">
        <div className="h-20 w-20 rounded-full bg-accent/15 text-accent flex items-center justify-center mb-6">
          <Icon.Check width={40} height={40} />
        </div>
        <h1 className="text-3xl font-bold">{state.timeUp ? "Time!" : "Workout complete!"}</h1>
        <p className="mt-2 text-muted">{plan.name}</p>
        {amrap && (newBest || prevBest) && (
          <p className="mt-3 text-sm">
            {newBest ? (
              <span className="text-rest font-semibold">New personal best!</span>
            ) : (
              prevBest && <span className="text-muted">Best so far: {formatResult(prevBest)}</span>
            )}
          </p>
        )}
        <div className="mt-8 grid grid-cols-3 gap-3 w-full max-w-md">
          {stats.map(([k, v]) => (
            <div key={k} className="rounded-2xl bg-surface border border-line p-2.5 sm:p-4 min-w-0">
              <div className="font-mono text-lg sm:text-2xl font-semibold leading-tight break-words">{v}</div>
              <div className="text-xs text-muted mt-1">{k}</div>
            </div>
          ))}
        </div>
        {amrap && (
          <div className="mt-6 w-full max-w-md">
            <div className="text-sm font-semibold mb-2">Your result</div>
            <div className="grid grid-cols-2 gap-3 w-full">
              {(
                [
                  {
                    label: "Rounds",
                    value: shown.rounds,
                    canDec: shown.rounds > 0,
                    canInc: shown.rounds < MAX_ROUNDS_EDIT,
                    dec: () => change({ ...shown, rounds: shown.rounds - 1 }),
                    inc: () => change({ ...shown, rounds: shown.rounds + 1 }),
                  },
                  {
                    label: "+ exercises",
                    value: shown.extra,
                    // stepping past the ends carries over into the round count
                    canDec: maxExtra > 0 && (shown.extra > 0 || shown.rounds > 0),
                    canInc: maxExtra > 0 && (shown.extra < maxExtra || shown.rounds < MAX_ROUNDS_EDIT),
                    dec: () =>
                      change(
                        shown.extra > 0
                          ? { ...shown, extra: shown.extra - 1 }
                          : { rounds: shown.rounds - 1, extra: maxExtra },
                      ),
                    inc: () =>
                      change(
                        shown.extra < maxExtra
                          ? { ...shown, extra: shown.extra + 1 }
                          : { rounds: shown.rounds + 1, extra: 0 },
                      ),
                  },
                ] as const
              ).map((c) => (
                <div key={c.label} className="rounded-2xl bg-surface border border-line p-2 sm:p-3 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <button
                      onClick={c.dec}
                      disabled={!c.canDec}
                      className="h-9 w-9 sm:h-11 sm:w-11 shrink-0 rounded-full bg-surface-2 text-xl disabled:opacity-30"
                      aria-label={`Decrease ${c.label}`}
                    >
                      −
                    </button>
                    <span className="min-w-0 font-mono text-xl sm:text-2xl font-semibold tabular-nums">{c.value}</span>
                    <button
                      onClick={c.inc}
                      disabled={!c.canInc}
                      className="h-9 w-9 sm:h-11 sm:w-11 shrink-0 rounded-full bg-surface-2 text-xl disabled:opacity-30"
                      aria-label={`Increase ${c.label}`}
                    >
                      +
                    </button>
                  </div>
                  <div className="text-xs text-muted mt-1">{c.label}</div>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">Counted from your taps – adjust if it’s off.</p>
          </div>
        )}
        <button
          onClick={onExit}
          className="mt-10 rounded-xl bg-accent hover:bg-accent-strong text-black px-8 py-3.5 font-semibold"
        >
          Back to overview
        </button>
      </div>
    );
  }

  if (!step) return null;

  const tone =
    step.kind === "work"
      ? { label: "Work", color: "var(--color-accent)", text: "text-accent-strong" }
      : step.kind === "rest"
        ? { label: step.roundBreak ? "Round break" : "Rest", color: "var(--color-rest)", text: "text-rest" }
        : { label: "Get ready", color: "var(--color-prep)", text: "text-prep" };

  const shownExercise = step.kind === "work" ? step.exercise : step.next;
  const shownSide = step.kind === "work" ? step.side : step.nextSide;
  const round = step.kind === "prepare" ? 1 : step.round;

  const upNext = steps.slice(state.index + 1).find((s) => s.kind === "work") as
    | Extract<Step, { kind: "work" }>
    | undefined;

  const ringSize = "h-[5.5rem] w-[5.5rem] sm:h-28 sm:w-28 short:h-20 short:w-20 lg:h-40 lg:w-40";
  const counter = timed ? (
    <Ring progress={state.remaining / ((step as { duration: number }).duration || 1)} color={tone.color} className={ringSize}>
      <div className="font-mono text-4xl lg:text-6xl font-semibold tabular-nums leading-none">{Math.max(0, secLeft)}</div>
      <div className="mt-0.5 text-[11px] text-muted">sec</div>
    </Ring>
  ) : step.kind === "work" ? (
    <Ring progress={1} color={tone.color} className={ringSize}>
      <div className="font-mono text-4xl lg:text-6xl font-semibold tabular-nums leading-none">{step.item.reps}</div>
      <div className="mt-0.5 text-[11px] text-muted">{step.side ? "reps/side" : "reps"}</div>
      <div className="text-[11px] text-muted font-mono">{formatDuration(state.stepElapsed)}</div>
    </Ring>
  ) : null;

  const baseViews = shownExercise.views ?? ["front", "side"];
  const views = viewMode === 0 ? baseViews : [baseViews[viewMode - 1]];
  const viewLabel = viewMode === 0 ? "Both views" : { front: "Front", side: "Side", top: "Top" }[views[0]];
  const allCues = step.kind === "work" ? step.exercise.cues : [];
  const cues = allCues.slice(1, 4);

  return (
    <div className="h-dvh flex flex-col overflow-hidden">
      {/* ---------- header ---------- */}
      <header className="shrink-0 flex items-center gap-1 sm:gap-2 px-2 sm:px-4 pt-[max(env(safe-area-inset-top),0.5rem)]">
        <button
          onClick={() => setConfirmExit(true)}
          className="h-11 w-11 shrink-0 rounded-full text-muted hover:text-ink hover:bg-surface flex items-center justify-center"
          aria-label="End workout"
        >
          <Icon.X />
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{plan.name}</div>
          <div className="text-xs text-muted truncate">
            {amrap ? (
              <>AMRAP · Round {round}</>
            ) : (
              <>
                Round {round}/{plan.rounds} · {formatDuration(state.total)}
              </>
            )}
          </div>
        </div>
        {amrap && (
          <button
            onClick={() => dispatch({ type: "toggle" })}
            className={`shrink-0 flex items-center gap-1.5 rounded-full border px-3 h-10 font-mono text-lg font-semibold tabular-nums transition-colors ${
              state.running ? "border-line bg-surface" : "border-prep/60 bg-prep/10 text-prep"
            }`}
            aria-label={state.running ? "Pause clock" : "Resume clock"}
          >
            {state.running ? <Icon.Pause width={14} height={14} /> : <Icon.Play width={14} height={14} />}
            {formatDuration(Math.max(0, capSecLeft))}
          </button>
        )}
        <button
          onClick={() => setSound((v) => !v)}
          className="h-11 w-11 shrink-0 rounded-full text-muted hover:text-ink hover:bg-surface flex items-center justify-center"
          aria-label={sound ? "Mute" : "Unmute"}
        >
          {sound ? <Icon.Sound /> : <Icon.Mute />}
        </button>
      </header>
      <div className="shrink-0 px-4 pt-1.5">
        <div className="h-1 rounded-full bg-surface-2 overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-300"
            style={{ width: `${(amrap ? state.capElapsed / Math.max(1, cap) : doneWork / Math.max(1, workSteps)) * 100}%` }}
          />
        </div>
      </div>

      <main className="flex-1 min-h-0 w-full max-w-6xl mx-auto px-3 sm:px-4 pt-3 flex flex-col gap-3 lg:grid lg:grid-cols-[3fr_2fr] lg:items-center lg:gap-6 lg:py-4 short:grid short:grid-cols-[1.15fr_1fr] short:items-stretch short:gap-3">
        {/* ---------- animation ---------- */}
        <div className="relative flex-1 min-h-0 rounded-3xl bg-linear-to-b from-surface-2 to-surface border border-line overflow-hidden p-1.5 sm:p-2 lg:flex-none lg:h-full lg:max-h-[70vh] short:h-full">
          <ExerciseAnimation
            key={`${state.index}`}
            exercise={shownExercise}
            mirrored={shownSide === "left"}
            playing={state.running}
            speed={step.kind === "work" ? 1 : 0.6}
            views={views}
            legend={false}
            className={`w-full h-full ${step.kind === "work" ? "" : "opacity-60"}`}
          />
          <button
            onClick={() => setViewMode((m) => (m + 1) % 3)}
            className="absolute right-2 bottom-2 z-10 rounded-full bg-black/60 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink/90"
            aria-label={`Camera: ${viewLabel}. Tap to change`}
          >
            {viewLabel} ⇄
          </button>
          <div className="pointer-events-none absolute right-2 top-2 flex flex-col items-end gap-1.5">
            {shownSide && (
              <span className="rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider">
                <span className={`mr-1.5 inline-block h-2 w-2 rounded-full ${shownSide === "left" ? "bg-limb-l" : "bg-limb-r"}`} />
                {sideLabel(shownSide)}
              </span>
            )}
            {step.kind === "work" && step.item.weight > 0 && (
              <span className="rounded-full bg-accent/20 text-accent-strong px-2.5 py-1 text-xs font-semibold font-mono">
                {usesTwoBells(step.exercise) ? `2 × ${step.item.weight}` : step.item.weight} kg
              </span>
            )}
          </div>
          {!state.running && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30">
              <span className="rounded-full bg-prep px-4 py-1.5 text-sm font-bold uppercase tracking-wider text-black">Paused</span>
            </div>
          )}
          {cues.length > 0 && (
            <>
              <button
                onClick={() => setShowCues((v) => !v)}
                aria-expanded={showCues}
                className="lg:hidden absolute left-2 bottom-2 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold"
              >
                {showCues ? "Hide tips" : "Form tips"}
              </button>
              {showCues && (
                <ul
                  onClick={() => setShowCues(false)}
                  className="lg:hidden absolute inset-x-2 top-2 bottom-11 overflow-auto rounded-2xl bg-bg/90 backdrop-blur p-4 space-y-2.5 text-sm leading-snug animate-fade-up"
                >
                  {allCues.map((c, i) => (
                    <li key={c} className="flex gap-2.5">
                      <span className="mt-px h-5 w-5 shrink-0 rounded-full bg-accent/15 text-accent-strong text-[11px] font-semibold flex items-center justify-center">
                        {i + 1}
                      </span>
                      {c}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>

        {/* ---------- info + controls ---------- */}
        <div className="shrink-0 flex flex-col gap-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] lg:items-center lg:text-center lg:gap-5 lg:pb-0 short:justify-center short:pb-2">
          <div key={state.index} className="flex items-center gap-4 animate-fade-up lg:flex-col lg:gap-4">
            <div className="min-w-0 flex-1 lg:flex-none">
              <div className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${tone.text}`}>{tone.label}</div>
              <h1 className="mt-0.5 text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight line-clamp-2">
                {step.kind === "work" ? step.exercise.name : `Next: ${shownExercise.name}`}
              </h1>
              {upNext && step.kind === "work" && (
                <div className="mt-1 text-sm text-muted truncate lg:hidden">
                  Next: <span className="text-ink">{upNext.exercise.name}</span>
                  {upNext.side && ` (${upNext.side})`}
                </div>
              )}
              {cues.length > 0 && (
                <ul className="hidden lg:block mt-3 text-sm text-muted max-w-sm mx-auto space-y-1">
                  {cues.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              )}
            </div>
            {counter}
          </div>

          <div className="flex items-center gap-3 lg:gap-4">
            <button
              onClick={() => goto(state.index - 1)}
              disabled={state.index === 0}
              className="h-14 w-14 shrink-0 rounded-full bg-surface border border-line flex items-center justify-center text-muted hover:text-ink disabled:opacity-30"
              aria-label="Previous"
            >
              <Icon.Prev />
            </button>
            {timed ? (
              <button
                onClick={() => {
                  unlockAudio();
                  dispatch({ type: "toggle" });
                }}
                className="h-16 flex-1 lg:flex-none lg:w-20 lg:h-20 rounded-full bg-accent hover:bg-accent-strong text-black flex items-center justify-center gap-2 font-semibold text-lg"
                aria-label={state.running ? "Pause" : "Resume"}
              >
                {state.running ? <Icon.Pause width={28} height={28} /> : <Icon.Play width={28} height={28} />}
                <span className="lg:hidden">{state.running ? "Pause" : "Resume"}</span>
              </button>
            ) : (
              <button
                onClick={() => goto(state.index + 1)}
                className="h-16 flex-1 lg:flex-none lg:h-20 lg:px-8 rounded-full bg-accent hover:bg-accent-strong text-black flex items-center justify-center gap-2 font-semibold text-lg"
              >
                <Icon.Check width={26} height={26} /> Done
              </button>
            )}
            <button
              onClick={() => goto(state.index + 1)}
              className="h-14 w-14 shrink-0 rounded-full bg-surface border border-line flex items-center justify-center text-muted hover:text-ink"
              aria-label="Skip"
            >
              <Icon.Next />
            </button>
          </div>

          {upNext && step.kind === "work" && (
            <div className="hidden lg:block text-sm text-muted">
              Up next: <span className="text-ink">{upNext.exercise.name}</span>
              {upNext.side && ` (${upNext.side})`}
            </div>
          )}
        </div>
      </main>

      {confirmExit && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center px-6">
          <div className="animate-fade-up w-full max-w-sm rounded-3xl bg-surface border border-line p-6 text-center">
            <h2 className="text-lg font-semibold">End workout?</h2>
            <p className="mt-2 text-sm text-muted">
              {summary.sets > 0 ? "Finished sets are saved to your history." : "Your progress in this workout will be lost."}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button onClick={() => setConfirmExit(false)} className="rounded-xl bg-surface-2 py-3 font-medium hover:bg-line">
                Keep going
              </button>
              <button
                onClick={() => {
                  window.speechSynthesis?.cancel();
                  if (!completed.current && summary.sets > 0) addSession(buildSession("aborted"));
                  onExit();
                }}
                className="rounded-xl bg-danger/90 hover:bg-danger text-black py-3 font-semibold"
              >
                End
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
