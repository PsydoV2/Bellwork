"use client";

import { useEffect, useState } from "react";
import type { Exercise } from "@/lib/exercises";
import { FigureView, viewBox } from "@/lib/figure";
import { sampleSkeleton, type ViewName } from "@/lib/skeleton";

interface Props {
  exercise: Exercise;
  playing?: boolean;
  /** Show the left side (mirrored) of a unilateral exercise. */
  mirrored?: boolean;
  speed?: number;
  /** Fixed phase (0..1); disables playback. */
  phase?: number;
  /** Which camera views to show. Default: the exercise's views (front + side). */
  views?: ViewName[];
  /** Small thumbnail: no labels, no floor line. */
  minimal?: boolean;
  /** Show the right/left colour legend. */
  legend?: boolean;
  className?: string;
  /** Classes for each view's svg. */
  viewClassName?: string;
}

const VIEW_LABEL: Record<ViewName, string> = { front: "Front", side: "Side", top: "Top" };

export function ExerciseAnimation({
  exercise,
  playing = true,
  mirrored = false,
  speed = 1,
  phase: fixedPhase,
  views,
  minimal = false,
  legend = false,
  className = "",
  viewClassName = "",
}: Props) {
  const [livePhase, setPhase] = useState(0);
  const phase = fixedPhase ?? livePhase;
  const run = playing && fixedPhase === undefined;
  const duration = exercise.duration;

  useEffect(() => {
    if (!run) return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(now - last, 100);
      last = now;
      setPhase((p) => (p + (dt * speed) / duration) % 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [run, speed, duration]);

  const s = sampleSkeleton(exercise.frames, phase, mirrored);
  const shown = views ?? exercise.views ?? ["front", "side"];

  return (
    <div className={`flex flex-col ${className}`} role="img" aria-label={`Animation: ${exercise.name}`}>
      <div className="flex flex-1 min-h-0 gap-1">
        {shown.map((v) => (
          <div key={v} className={`relative flex-1 min-w-0 ${viewClassName}`}>
            <FigureView s={s} view={v} box={viewBox(exercise, v)} minimal={minimal} className="w-full h-full" />
            {!minimal && shown.length > 1 && (
              <span className="absolute left-2 top-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted/80">
                {VIEW_LABEL[v]}
              </span>
            )}
          </div>
        ))}
      </div>
      {legend && (
        <div className="flex items-center justify-center gap-4 pb-2 pt-1 text-[11px] text-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-4 rounded-full bg-limb-r" /> Right side
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-4 rounded-full bg-limb-l" /> Left side
          </span>
        </div>
      )}
    </div>
  );
}
