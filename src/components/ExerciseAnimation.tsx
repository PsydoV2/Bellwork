"use client";

import { useEffect, useState } from "react";
import type { Exercise } from "@/lib/exercises";
import { B, project, sampleSkeleton, type Skeleton, type V3, type ViewName } from "@/lib/skeleton";

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

// ---------------------------------------------------------------------------
// View boxes: computed once per exercise & view from sampled poses, so the
// figure keeps the same scale and position during the whole movement.
// ---------------------------------------------------------------------------
type Box = { x: number; y: number; w: number; h: number };
const boxCache = new Map<string, Box>();

function pointsOf(s: Skeleton): V3[] {
  return [
    s.head, s.neck, s.shoulderR, s.shoulderL, s.elbowR, s.elbowL, s.handR, s.handL, s.pelvis,
    s.hipR, s.hipL, s.kneeR, s.kneeL, s.ankleR, s.ankleL, s.toeR, s.toeL, s.bellBody,
    ...(s.bellBody2 ? [s.bellBody2] : []),
  ];
}

function viewBox(ex: Exercise, view: ViewName): Box {
  const key = `${ex.id}:${view}`;
  const hit = boxCache.get(key);
  if (hit) return hit;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const mirrored of [false, true]) {
    for (let i = 0; i < 40; i++) {
      const s = sampleSkeleton(ex.frames, i / 40, mirrored);
      for (const p of pointsOf(s)) {
        const [x, y] = project(p, view);
        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      }
    }
  }
  const pad = 18;
  minX -= pad; maxX += pad; minY -= pad; maxY += pad;
  if (view !== "top") maxY = Math.max(maxY, 8);
  // fixed aspect ratio (w:h = 4:5) so views line up nicely
  let w = maxX - minX;
  let h = maxY - minY;
  const aspect = 0.8;
  if (w / h < aspect) {
    const nw = h * aspect;
    minX -= (nw - w) / 2;
    w = nw;
  } else {
    const nh = w / aspect;
    if (view === "top") minY -= (nh - h) / 2;
    else minY -= nh - h; // keep the floor at the bottom
    h = nh;
  }
  const box = { x: minX, y: minY, w, h };
  boxCache.set(key, box);
  return box;
}

// ---------------------------------------------------------------------------
type Item =
  | { kind: "seg"; a: V3; b: V3; width: number; cls: string; depth: number }
  | { kind: "poly"; pts: V3[]; cls: string; depth: number }
  | { kind: "head"; c: V3; neck: V3; depth: number }
  | { kind: "bell"; handle: V3; body: V3; depth: number };

function buildItems(s: Skeleton, view: ViewName): Item[] {
  const d = (p: V3) => project(p, view)[2];
  const seg = (a: V3, b: V3, width: number, cls: string): Item => ({
    kind: "seg",
    a,
    b,
    width,
    cls,
    depth: (d(a) + d(b)) / 2,
  });
  const torso: V3[] = [s.shoulderR, s.shoulderL, s.hipL, s.hipR];
  const items: Item[] = [
    { kind: "poly", pts: torso, cls: "kb-torso", depth: torso.reduce((acc, p) => acc + d(p), 0) / 4 },
    { kind: "head", c: s.head, neck: s.neck, depth: Math.max(d(s.head), d(s.neck)) },
    seg(s.hipR, s.kneeR, 11, "kb-r"),
    seg(s.kneeR, s.ankleR, 9, "kb-r"),
    seg(s.ankleR, s.toeR, 6, "kb-r"),
    seg(s.hipL, s.kneeL, 11, "kb-l"),
    seg(s.kneeL, s.ankleL, 9, "kb-l"),
    seg(s.ankleL, s.toeL, 6, "kb-l"),
    seg(s.shoulderR, s.elbowR, 8, "kb-r"),
    seg(s.elbowR, s.handR, 7, "kb-r"),
    seg(s.shoulderL, s.elbowL, 8, "kb-l"),
    seg(s.elbowL, s.handL, 7, "kb-l"),
    { kind: "bell", handle: s.bell, body: s.bellBody, depth: d(s.bellBody) + 2 },
  ];
  if (s.bell2 && s.bellBody2) items.push({ kind: "bell", handle: s.bell2, body: s.bellBody2, depth: d(s.bellBody2) + 2 });
  return items.sort((a, b) => a.depth - b.depth);
}

function View({ s, view, box, minimal }: { s: Skeleton; view: ViewName; box: Box; minimal: boolean }) {
  const P = (p: V3) => project(p, view);
  const items = buildItems(s, view);
  return (
    <svg
      viewBox={`${box.x.toFixed(1)} ${box.y.toFixed(1)} ${box.w.toFixed(1)} ${box.h.toFixed(1)}`}
      className="w-full h-full"
      preserveAspectRatio="xMidYMid meet"
    >
      {view !== "top" && (
        <>
          {!minimal && <line x1={box.x} y1={0} x2={box.x + box.w} y2={0} className="stroke-line" strokeWidth={1.5} />}
          <ellipse cx={P(s.pelvis)[0]} cy={1} rx={view === "front" ? 34 : 40} ry={4} className="fill-shadow" />
        </>
      )}
      {view === "top" && !minimal && (
        <rect x={box.x + 6} y={box.y + 6} width={box.w - 12} height={box.h - 12} rx={8} className="fill-none stroke-line" strokeDasharray="4 6" />
      )}
      {items.map((it, i) => {
        if (it.kind === "seg") {
          const [x1, y1] = P(it.a);
          const [x2, y2] = P(it.b);
          return (
            <g key={i} strokeLinecap="round">
              <line x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={it.width + 3} className="kb-outline" />
              <line x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={it.width} className={it.cls} />
            </g>
          );
        }
        if (it.kind === "poly") {
          return (
            <polygon
              key={i}
              points={it.pts.map((p) => P(p).slice(0, 2).map((n) => n.toFixed(1)).join(",")).join(" ")}
              strokeWidth={10}
              strokeLinejoin="round"
              className={it.cls}
            />
          );
        }
        if (it.kind === "head") {
          const [cx, cy] = P(it.c);
          const [nx, ny] = P(it.neck);
          const behind = project(it.neck, view)[2] > project(it.c, view)[2];
          const neck = <line x1={nx} y1={ny} x2={cx} y2={cy} strokeWidth={7} strokeLinecap="round" className="kb-torso-line" />;
          return (
            <g key={i}>
              {!behind && neck}
              <circle cx={cx} cy={cy} r={B.headR} className="kb-head" />
              {behind && <line x1={nx} y1={ny} x2={nx + (cx - nx) * 0.35} y2={ny + (cy - ny) * 0.35} strokeWidth={7} strokeLinecap="round" className="kb-torso-line" />}
            </g>
          );
        }
        const [hx, hy] = P(it.handle);
        const [bx, by] = P(it.body);
        const dx = bx - hx;
        const dy = by - hy;
        const l = Math.hypot(dx, dy);
        const ang = (Math.atan2(dy, dx) * 180) / Math.PI - 90;
        const legs = Math.min(l, 8);
        return (
          <g key={i}>
            {l > 2 && (
              <path
                transform={`translate(${hx.toFixed(1)} ${hy.toFixed(1)}) rotate(${ang.toFixed(1)})`}
                d={`M -6 ${legs} Q -7.5 -6 0 -6 Q 7.5 -6 6 ${legs}`}
                className="fill-none stroke-bell-dark"
                strokeWidth={3.2}
                strokeLinecap="round"
              />
            )}
            <circle cx={bx} cy={by} r={B.bellR} className="fill-bell" />
            <circle cx={bx - 3.5} cy={by - 3.5} r={3} className="fill-bell-shine" />
          </g>
        );
      })}
    </svg>
  );
}

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
            <View s={s} view={v} box={viewBox(exercise, v)} minimal={minimal} />
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
