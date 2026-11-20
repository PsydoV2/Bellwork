"use client";

import { useState } from "react";
import { getExercise, getVariants, usesTwoBells } from "@/lib/exercises";
import {
  DEFAULT_TIME_CAP,
  estimateSeconds,
  formatDuration,
  isAmrap,
  newItem,
  upsertPlan,
  type PlanFormat,
  type WorkoutItem,
  type WorkoutPlan,
} from "@/lib/store";
import { ExerciseAnimation } from "./ExerciseAnimation";
import { ExerciseDetail, ExerciseGrid } from "./ExerciseLibrary";
import { Icon, Modal } from "./ui";

function NumberField({
  label,
  value,
  onChange,
  suffix,
  min = 0,
  max = 999,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  return (
    <label className="flex flex-col gap-1 min-w-0">
      <span className="text-[11px] uppercase tracking-wider text-muted">{label}</span>
      <div className="flex items-center rounded-xl bg-surface-2 border border-line focus-within:border-accent">
        <button
          type="button"
          onClick={() => onChange(clamp(value - step))}
          className="px-2.5 py-2 text-muted hover:text-ink"
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <input
          type="number"
          inputMode="decimal"
          value={Number.isFinite(value) ? value : 0}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(clamp(Number(e.target.value) || 0))}
          className="w-full min-w-0 bg-transparent text-center font-mono text-sm py-2 outline-none"
        />
        {suffix && <span className="text-xs text-muted pr-1">{suffix}</span>}
        <button
          type="button"
          onClick={() => onChange(clamp(value + step))}
          className="px-2.5 py-2 text-muted hover:text-ink"
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </label>
  );
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
  className = "",
}: {
  value: T;
  options: readonly (readonly [T, string])[];
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div
      className={`grid rounded-xl bg-surface-2 border border-line p-0.5 text-sm ${className}`}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map(([v, label]) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          aria-pressed={value === v}
          className={`rounded-[10px] px-2 py-1.5 font-medium transition-colors truncate ${
            value === v ? "bg-ink text-bg" : "text-muted hover:text-ink"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function ItemRow({
  item,
  index,
  count,
  amrap,
  onChange,
  onMove,
  onRemove,
  onInfo,
}: {
  item: WorkoutItem;
  index: number;
  count: number;
  amrap: boolean;
  onChange: (i: WorkoutItem) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
  onInfo: () => void;
}) {
  const ex = getExercise(item.exerciseId);
  const variants = getVariants(ex);
  const set = (patch: Partial<WorkoutItem>) => onChange({ ...item, ...patch });
  return (
    <div className="animate-fade-up rounded-2xl bg-surface border border-line p-3 sm:p-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onInfo}
          className="h-16 w-16 shrink-0 rounded-xl bg-surface-2 overflow-hidden"
          aria-label={`View ${ex.name}`}
        >
          <ExerciseAnimation exercise={ex} minimal views={["side"]} className="w-full h-full" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="text-xs text-muted font-mono">#{index + 1}</div>
          <div className="font-semibold truncate">{ex.name}</div>
          <div className="text-xs text-muted truncate">
            {ex.subtitle}
            {ex.unilateral && " · each side"}
          </div>
        </div>
        <div className="flex items-center">
          <button
            disabled={index === 0}
            onClick={() => onMove(-1)}
            className="p-2 rounded-lg text-muted hover:text-ink disabled:opacity-30"
            aria-label="Move up"
          >
            <Icon.Up />
          </button>
          <button
            disabled={index === count - 1}
            onClick={() => onMove(1)}
            className="p-2 rounded-lg text-muted hover:text-ink disabled:opacity-30"
            aria-label="Move down"
          >
            <Icon.Down />
          </button>
          <button
            onClick={onRemove}
            className="p-2 rounded-lg text-muted hover:text-danger"
            aria-label="Remove"
          >
            <Icon.Trash />
          </button>
        </div>
      </div>

      {variants.length > 1 && (
        <div className="mt-3 flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wider text-muted">Grip</span>
          <Segmented
            value={ex.id}
            options={variants.map((v) => [v.id, v.variant!.label] as const)}
            onChange={(exerciseId) => set({ exerciseId })}
          />
        </div>
      )}

      <div className={`mt-3 grid grid-cols-2 gap-2.5 ${amrap ? "sm:grid-cols-3" : "sm:grid-cols-4"}`}>
        <div className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wider text-muted">Mode</span>
          <Segmented
            value={item.mode}
            options={[
              ["reps", "Reps"],
              ["time", "Time"],
            ]}
            onChange={(mode) => set({ mode })}
          />
        </div>
        {item.mode === "reps" ? (
          <NumberField label="Reps" value={item.reps} min={1} max={200} onChange={(reps) => set({ reps })} />
        ) : (
          <NumberField
            label="Duration"
            value={item.duration}
            min={5}
            max={600}
            step={5}
            suffix="s"
            onChange={(duration) => set({ duration })}
          />
        )}
        <NumberField
          label={usesTwoBells(ex) ? "Weight (each)" : "Weight"}
          value={item.weight}
          min={0}
          max={100}
          step={2}
          suffix="kg"
          onChange={(weight) => set({ weight })}
        />
        {!amrap && (
          <NumberField label="Rest after" value={item.rest} min={0} max={600} step={5} suffix="s" onChange={(rest) => set({ rest })} />
        )}
      </div>
    </div>
  );
}

export function PlanEditor({
  initial,
  onDone,
}: {
  initial: WorkoutPlan;
  onDone: (saved: WorkoutPlan | null) => void;
}) {
  const [plan, setPlan] = useState<WorkoutPlan>(initial);
  const amrap = isAmrap(plan);
  const setFormat = (format: PlanFormat) =>
    setPlan((p) => ({
      ...p,
      format,
      timeCap: p.timeCap ?? DEFAULT_TIME_CAP,
      // a short break when the circuit starts over is typical for AMRAPs
      roundRest: format === "amrap" && p.format !== "amrap" ? Math.min(p.roundRest, 30) : p.roundRest,
    }));
  const [picking, setPicking] = useState(false);
  const [infoId, setInfoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const setItems = (fn: (items: WorkoutItem[]) => WorkoutItem[]) =>
    setPlan((p) => ({ ...p, items: fn(p.items) }));

  const save = () => {
    if (!plan.name.trim()) return setError("Please give your plan a name.");
    if (plan.items.length === 0) return setError("Add at least one exercise.");
    const saved = { ...plan, name: plan.name.trim() };
    upsertPlan(saved);
    onDone(saved);
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-32 pt-4 sm:pt-8">
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => onDone(null)}
          className="p-2 -ml-2 rounded-full text-muted hover:text-ink hover:bg-surface"
          aria-label="Back"
        >
          <Icon.Back />
        </button>
        <h1 className="text-xl font-semibold">{initial.name ? "Edit plan" : "New plan"}</h1>
      </div>

      <div className="space-y-4">
        <label className="block">
          <span className="text-[11px] uppercase tracking-wider text-muted">Name</span>
          <input
            value={plan.name}
            onChange={(e) => {
              setError(null);
              setPlan({ ...plan, name: e.target.value });
            }}
            placeholder="e.g. Monday – Full body"
            className="mt-1 w-full rounded-xl bg-surface border border-line focus:border-accent outline-none px-4 py-3 text-lg font-medium placeholder:text-muted/60"
          />
        </label>
        <div className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wider text-muted">Format</span>
          <Segmented
            value={plan.format ?? "rounds"}
            options={[
              ["rounds", "Fixed rounds"],
              ["amrap", "AMRAP (time cap)"],
            ]}
            onChange={setFormat}
          />
          <p className="text-xs text-muted mt-1">
            {amrap
              ? "As many rounds as possible: the exercises run back-to-back in a fixed order, with a short break only when the circuit starts over – until the time is up."
              : "A set number of rounds with rest after every exercise and a longer break between rounds."}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {amrap ? (
            <NumberField
              label="Time cap"
              value={Math.round((plan.timeCap ?? DEFAULT_TIME_CAP) / 60)}
              min={1}
              max={120}
              suffix="min"
              onChange={(m) => setPlan({ ...plan, timeCap: m * 60 })}
            />
          ) : (
            <NumberField label="Rounds" value={plan.rounds} min={1} max={20} onChange={(rounds) => setPlan({ ...plan, rounds })} />
          )}
          <NumberField
            label={amrap ? "Break before each new round" : "Rest between rounds"}
            value={plan.roundRest}
            min={0}
            max={600}
            step={amrap ? 5 : 15}
            suffix="s"
            onChange={(roundRest) => setPlan({ ...plan, roundRest })}
          />
        </div>
      </div>

      <div className="mt-8 mb-3 flex items-end justify-between">
        <h2 className="text-sm uppercase tracking-wider text-muted">{amrap ? "Circuit (in order, no rest)" : "Exercises per round"}</h2>
        <span className="text-sm text-muted flex items-center gap-1.5">
          <Icon.Clock width={16} height={16} /> {amrap ? "" : "approx. "}
          {formatDuration(estimateSeconds(plan) - (amrap ? 10 : 0))} min
        </span>
      </div>

      <div className="space-y-3">
        {plan.items.map((it, i) => (
          <ItemRow
            key={it.id}
            item={it}
            index={i}
            count={plan.items.length}
            amrap={amrap}
            onInfo={() => setInfoId(it.exerciseId)}
            onChange={(next) => setItems((items) => items.map((x) => (x.id === it.id ? next : x)))}
            onRemove={() => setItems((items) => items.filter((x) => x.id !== it.id))}
            onMove={(dir) =>
              setItems((items) => {
                const arr = [...items];
                const j = i + dir;
                [arr[i], arr[j]] = [arr[j], arr[i]];
                return arr;
              })
            }
          />
        ))}
        <button
          onClick={() => {
            setError(null);
            setPicking(true);
          }}
          className="w-full rounded-2xl border-2 border-dashed border-line hover:border-accent/70 hover:text-accent-strong text-muted py-5 flex items-center justify-center gap-2 font-medium transition-colors"
        >
          <Icon.Plus /> Add exercise
        </button>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/90 backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center gap-3">
          <p className="flex-1 text-sm text-danger min-h-5">{error}</p>
          <button onClick={() => onDone(null)} className="rounded-xl px-4 py-3 font-medium text-muted hover:text-ink">
            Cancel
          </button>
          <button
            onClick={save}
            className="rounded-xl bg-accent hover:bg-accent-strong text-black px-6 py-3 font-semibold transition-colors"
          >
            Save
          </button>
        </div>
      </div>

      <Modal open={picking} onClose={() => setPicking(false)} title="Add exercise" wide>
        <ExerciseGrid
          action="+ Add"
          onSelect={(e) => {
            setItems((items) => [...items, newItem(e.id)]);
            setPicking(false);
          }}
        />
      </Modal>
      <Modal open={!!infoId} onClose={() => setInfoId(null)} title={infoId ? getExercise(infoId).name : ""} wide>
        {infoId && <ExerciseDetail key={infoId} exercise={getExercise(infoId)} />}
      </Modal>
    </div>
  );
}
