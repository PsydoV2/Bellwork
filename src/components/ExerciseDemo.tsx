"use client";

import { useEffect, useState } from "react";
import { getExercise, getVariants } from "@/lib/exercises";
import type { ViewName } from "@/lib/skeleton";
import { ExerciseAnimation } from "./ExerciseAnimation";

/** Animated demo looked up by id on the client (keeps the keyframe data out of the server payload). */
export function ExerciseDemo({
  id,
  views,
  minimal,
  legend,
  playing = true,
  phase,
  className = "w-full aspect-[8/5]",
}: {
  id: string;
  views?: ViewName[];
  minimal?: boolean;
  legend?: boolean;
  playing?: boolean;
  phase?: number;
  className?: string;
}) {
  return (
    <ExerciseAnimation
      exercise={getExercise(id)}
      views={views}
      minimal={minimal}
      legend={legend}
      playing={playing}
      phase={phase}
      className={className}
    />
  );
}

/** Exercise guide demo with speed + side controls. */
export function ExerciseDemoPlayer({ id }: { id: string }) {
  const ex = getExercise(id);
  const [speed, setSpeed] = useState(1);
  const [left, setLeft] = useState(false);
  return (
    <div className="rounded-3xl bg-linear-to-b from-surface-2 to-surface border border-line p-2">
      <ExerciseAnimation exercise={ex} speed={speed} mirrored={left} legend className="w-full aspect-[8/5] sm:aspect-[2/1]" />
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 pb-2">
        <div className="flex gap-1" role="group" aria-label="Playback speed">
          {[0.5, 1, 1.5].map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              aria-pressed={speed === s}
              className={`px-3 py-1 rounded-full text-xs font-medium ${speed === s ? "bg-accent text-black" : "text-muted hover:text-ink"}`}
            >
              {s}×
            </button>
          ))}
        </div>
        {ex.unilateral && (
          <div className="flex gap-1" role="group" aria-label="Side">
            {[false, true].map((l) => (
              <button
                key={String(l)}
                onClick={() => setLeft(l)}
                aria-pressed={left === l}
                className={`px-3 py-1 rounded-full text-xs font-medium ${left === l ? "bg-ink text-bg" : "text-muted hover:text-ink"}`}
              >
                {l ? "Left side" : "Right side"}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const HERO_IDS = ["swing", "front-squat-double", "windmill", "renegade-row", "clean-press", "gorilla-row"];

/** Landing hero: cycles through a few exercises. */
export function HeroDemo() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setI((n) => (n + 1) % HERO_IDS.length), 6000);
    return () => window.clearInterval(t);
  }, []);
  const ex = getExercise(HERO_IDS[i]);
  const variant = ex.variant ? ` · ${ex.variant.label}` : "";
  return (
    <figure className="relative rounded-[2rem] bg-linear-to-b from-surface-2 to-surface border border-line p-3 shadow-2xl shadow-black/40">
      <ExerciseAnimation key={ex.id} exercise={ex} legend className="w-full aspect-[8/5] animate-fade-up" />
      <figcaption className="flex items-center justify-between gap-3 px-2 pb-1 text-sm">
        <span className="font-semibold">
          {ex.name}
          <span className="text-muted font-normal">{variant}</span>
        </span>
        <span className="flex gap-1.5" aria-hidden>
          {HERO_IDS.map((id, n) => (
            <span key={id} className={`h-1.5 rounded-full transition-all ${n === i ? "w-5 bg-accent" : "w-1.5 bg-line"}`} />
          ))}
        </span>
      </figcaption>
      {getVariants(ex).length > 1 && <span className="sr-only">Also available as {getVariants(ex).map((v) => v.variant!.label).join(", ")}</span>}
    </figure>
  );
}
