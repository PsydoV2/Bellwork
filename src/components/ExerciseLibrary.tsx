"use client";

import { useState } from "react";
import { EXERCISES, getVariants, isPrimary, type Category, type Exercise } from "@/lib/exercises";
import { ExerciseAnimation } from "./ExerciseAnimation";
import { Badge, Modal } from "./ui";

const CATEGORIES: ("All" | Category)[] = ["All", "Ballistic", "Strength", "Legs", "Upper Body", "Full Body", "Core"];

export function ExerciseCard({
  exercise,
  onClick,
  action,
}: {
  exercise: Exercise;
  onClick: () => void;
  action?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="group text-left rounded-2xl bg-surface border border-line hover:border-accent/60 transition-colors overflow-hidden flex flex-col"
    >
      <div className="bg-linear-to-b from-surface-2 to-surface aspect-[8/5] p-1">
        <ExerciseAnimation exercise={exercise} className="w-full h-full" />
      </div>
      <div className="p-3.5 flex-1 flex flex-col gap-1.5">
        <div className="font-semibold leading-tight">{exercise.name}</div>
        <div className="text-xs text-muted leading-snug">{exercise.subtitle}</div>
        <div className="mt-auto pt-2 flex flex-wrap gap-1.5">
          <Badge>{exercise.category}</Badge>
          {exercise.unilateral && <Badge>each side</Badge>}
          {getVariants(exercise).length > 1 && (
            <Badge>{getVariants(exercise).map((v) => v.variant!.label).join(" · ")}</Badge>
          )}
          {action && <Badge tone="accent">{action}</Badge>}
        </div>
      </div>
    </button>
  );
}

export function ExerciseDetail({ exercise: initial }: { exercise: Exercise }) {
  const [speed, setSpeed] = useState(1);
  const [left, setLeft] = useState(false);
  const [exercise, setExercise] = useState(initial);
  const variants = getVariants(exercise);
  return (
    <div className="space-y-5">
      {variants.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-muted">Grip</span>
          {variants.map((v) => (
            <button
              key={v.id}
              onClick={() => setExercise(v)}
              aria-pressed={v.id === exercise.id}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium border transition-colors ${
                v.id === exercise.id ? "bg-ink text-bg border-ink" : "border-line text-muted hover:text-ink"
              }`}
            >
              {v.variant!.label}
            </button>
          ))}
          {exercise.id !== initial.id && <span className="text-sm text-muted">· {exercise.name}</span>}
        </div>
      )}
      <div className="rounded-2xl bg-surface-2 p-2">
        <ExerciseAnimation
          exercise={exercise}
          speed={speed}
          mirrored={left}
          legend
          className="w-full aspect-[8/5] sm:aspect-[2/1]"
        />
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 pb-2">
          <div className="flex gap-1">
            {[0.5, 1, 1.5].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  speed === s ? "bg-accent text-black" : "text-muted hover:text-ink"
                }`}
              >
                {s}×
              </button>
            ))}
          </div>
          {exercise.unilateral && (
            <div className="flex gap-1">
              {[false, true].map((l) => (
                <button
                  key={String(l)}
                  onClick={() => setLeft(l)}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    left === l ? "bg-ink text-bg" : "text-muted hover:text-ink"
                  }`}
                >
                  {l ? "Left side" : "Right side"}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-4">
          <div>
            <div className="text-sm text-muted">{exercise.subtitle}</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge tone="accent">{exercise.difficulty}</Badge>
              <Badge>{exercise.category}</Badge>
              {exercise.unilateral && <Badge>each side</Badge>}
            </div>
          </div>
          <p className="text-sm leading-relaxed text-ink/90">{exercise.description}</p>
          <div>
            <h3 className="text-xs uppercase tracking-wider text-muted mb-2">Muscles</h3>
            <div className="flex flex-wrap gap-1.5">
              {exercise.muscles.map((m) => (
                <Badge key={m}>{m}</Badge>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <h3 className="text-xs uppercase tracking-wider text-muted mb-2">How to do it</h3>
            <ol className="space-y-1.5 text-sm">
              {exercise.cues.map((c, i) => (
                <li key={c} className="flex gap-2.5">
                  <span className="mt-px h-5 w-5 shrink-0 rounded-full bg-accent/15 text-accent-strong text-[11px] font-semibold flex items-center justify-center">
                    {i + 1}
                  </span>
                  {c}
                </li>
              ))}
            </ol>
          </div>
          <div>
            <h3 className="text-xs uppercase tracking-wider text-muted mb-2">Avoid</h3>
            <ul className="space-y-1.5 text-sm">
              {exercise.mistakes.map((m) => (
                <li key={m} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-danger" />
                  {m}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ExerciseGrid({ onSelect, action }: { onSelect: (e: Exercise) => void; action?: string }) {
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("All");
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const matches = (e: Exercise) =>
    e.name.toLowerCase().includes(q) || e.subtitle.toLowerCase().includes(q) || e.muscles.some((m) => m.toLowerCase().includes(q));
  // one card per movement – the other grips are picked inside the card / plan
  const list = EXERCISES.filter(
    (e) => isPrimary(e) && (cat === "All" || e.category === cat) && (!q || getVariants(e).some(matches)),
  );
  return (
    <div className="space-y-4">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search exercises or muscles…"
        className="w-full rounded-xl bg-surface border border-line focus:border-accent outline-none px-4 py-2.5 text-sm placeholder:text-muted/70"
      />
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium border transition-colors ${
              cat === c ? "bg-ink text-bg border-ink" : "border-line text-muted hover:text-ink"
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {list.map((e) => (
          <ExerciseCard key={e.id} exercise={e} onClick={() => onSelect(e)} action={action} />
        ))}
      </div>
      {list.length === 0 && <p className="text-center text-sm text-muted py-8">No exercises found.</p>}
    </div>
  );
}

export function ExerciseLibrary() {
  const [selected, setSelected] = useState<Exercise | null>(null);
  return (
    <>
      <ExerciseGrid onSelect={setSelected} />
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.name ?? ""} wide>
        {selected && <ExerciseDetail key={selected.id} exercise={selected} />}
      </Modal>
    </>
  );
}
