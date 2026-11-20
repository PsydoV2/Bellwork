/**
 * Renders one projected pose of the exercise skeleton as SVG.
 * Pure (no hooks, no CSS classes – colours are plain attributes), so the same code
 * draws the live animation in the browser and the figures in the OG images.
 */
import type { Exercise } from "./exercises";
import { B, project, sampleSkeleton, type Skeleton, type V3, type ViewName } from "./skeleton";

/** Mirrors the colour tokens in globals.css (the site only has a dark theme). */
export const FIG = {
  limbR: "#f4f1ea",
  limbL: "#6fa8ff",
  body: "#c9c4bb",
  outline: "#1e2125",
  line: "#2b2f35",
  shadow: "rgba(0,0,0,0.45)",
  bell: "#ff6a2b",
  bellDark: "#c9501b",
  bellShine: "rgba(255,255,255,0.35)",
};

// ---------------------------------------------------------------------------
// View boxes: computed once per exercise & view from sampled poses, so the
// figure keeps the same scale and position during the whole movement.
// ---------------------------------------------------------------------------
export type Box = { x: number; y: number; w: number; h: number };
const boxCache = new Map<string, Box>();

function pointsOf(s: Skeleton): V3[] {
  return [
    s.head, s.neck, s.shoulderR, s.shoulderL, s.elbowR, s.elbowL, s.handR, s.handL, s.pelvis,
    s.hipR, s.hipL, s.kneeR, s.kneeL, s.ankleR, s.ankleL, s.toeR, s.toeL, s.bellBody,
    ...(s.bellBody2 ? [s.bellBody2] : []),
  ];
}

export function viewBox(ex: Exercise, view: ViewName): Box {
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
  | { kind: "seg"; a: V3; b: V3; width: number; color: string; depth: number }
  | { kind: "poly"; pts: V3[]; depth: number }
  | { kind: "head"; c: V3; neck: V3; depth: number }
  | { kind: "bell"; handle: V3; body: V3; depth: number };

function buildItems(s: Skeleton, view: ViewName): Item[] {
  const d = (p: V3) => project(p, view)[2];
  const seg = (a: V3, b: V3, width: number, color: string): Item => ({
    kind: "seg",
    a,
    b,
    width,
    color,
    depth: (d(a) + d(b)) / 2,
  });
  const torso: V3[] = [s.shoulderR, s.shoulderL, s.hipL, s.hipR];
  const items: Item[] = [
    { kind: "poly", pts: torso, depth: torso.reduce((acc, p) => acc + d(p), 0) / 4 },
    { kind: "head", c: s.head, neck: s.neck, depth: Math.max(d(s.head), d(s.neck)) },
    seg(s.hipR, s.kneeR, 11, FIG.limbR),
    seg(s.kneeR, s.ankleR, 9, FIG.limbR),
    seg(s.ankleR, s.toeR, 6, FIG.limbR),
    seg(s.hipL, s.kneeL, 11, FIG.limbL),
    seg(s.kneeL, s.ankleL, 9, FIG.limbL),
    seg(s.ankleL, s.toeL, 6, FIG.limbL),
    seg(s.shoulderR, s.elbowR, 8, FIG.limbR),
    seg(s.elbowR, s.handR, 7, FIG.limbR),
    seg(s.shoulderL, s.elbowL, 8, FIG.limbL),
    seg(s.elbowL, s.handL, 7, FIG.limbL),
    { kind: "bell", handle: s.bell, body: s.bellBody, depth: d(s.bellBody) + 2 },
  ];
  if (s.bell2 && s.bellBody2) items.push({ kind: "bell", handle: s.bell2, body: s.bellBody2, depth: d(s.bellBody2) + 2 });
  return items.sort((a, b) => a.depth - b.depth);
}

const f1 = (n: number) => n.toFixed(1);

export function FigureView({
  s,
  view,
  box,
  minimal = false,
  width,
  height,
  className,
}: {
  s: Skeleton;
  view: ViewName;
  box: Box;
  minimal?: boolean;
  /** Pixel size – needed for OG images; in the browser use `className` instead. */
  width?: number;
  height?: number;
  className?: string;
}) {
  const P = (p: V3) => project(p, view);
  const items = buildItems(s, view);
  return (
    <svg
      viewBox={`${f1(box.x)} ${f1(box.y)} ${f1(box.w)} ${f1(box.h)}`}
      width={width}
      height={height}
      className={className}
      preserveAspectRatio="xMidYMid meet"
    >
      {view !== "top" && (
        <>
          {!minimal && <line x1={f1(box.x)} y1="0" x2={f1(box.x + box.w)} y2="0" stroke={FIG.line} strokeWidth={1.5} />}
          <ellipse cx={f1(P(s.pelvis)[0])} cy="1" rx={view === "front" ? 34 : 40} ry="4" fill={FIG.shadow} />
        </>
      )}
      {view === "top" && !minimal && (
        <rect
          x={f1(box.x + 6)}
          y={f1(box.y + 6)}
          width={f1(box.w - 12)}
          height={f1(box.h - 12)}
          rx="8"
          fill="none"
          stroke={FIG.line}
          strokeDasharray="4 6"
        />
      )}
      {items.map((it, i) => {
        if (it.kind === "seg") {
          const [x1, y1] = P(it.a);
          const [x2, y2] = P(it.b);
          return (
            <g key={i} strokeLinecap="round">
              <line x1={f1(x1)} y1={f1(y1)} x2={f1(x2)} y2={f1(y2)} strokeWidth={it.width + 3} stroke={FIG.outline} />
              <line x1={f1(x1)} y1={f1(y1)} x2={f1(x2)} y2={f1(y2)} strokeWidth={it.width} stroke={it.color} />
            </g>
          );
        }
        if (it.kind === "poly") {
          return (
            <polygon
              key={i}
              points={it.pts.map((p) => P(p).slice(0, 2).map(f1).join(",")).join(" ")}
              strokeWidth={10}
              strokeLinejoin="round"
              fill={FIG.body}
              stroke={FIG.body}
            />
          );
        }
        if (it.kind === "head") {
          const [cx, cy] = P(it.c);
          const [nx, ny] = P(it.neck);
          const behind = project(it.neck, view)[2] > project(it.c, view)[2];
          return (
            <g key={i}>
              {!behind && (
                <line x1={f1(nx)} y1={f1(ny)} x2={f1(cx)} y2={f1(cy)} strokeWidth={7} strokeLinecap="round" stroke={FIG.body} />
              )}
              <circle cx={f1(cx)} cy={f1(cy)} r={B.headR} fill={FIG.body} stroke={FIG.outline} strokeWidth={2} />
              {behind && (
                <line
                  x1={f1(nx)}
                  y1={f1(ny)}
                  x2={f1(nx + (cx - nx) * 0.35)}
                  y2={f1(ny + (cy - ny) * 0.35)}
                  strokeWidth={7}
                  strokeLinecap="round"
                  stroke={FIG.body}
                />
              )}
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
                transform={`translate(${f1(hx)} ${f1(hy)}) rotate(${f1(ang)})`}
                d={`M -6 ${f1(legs)} Q -7.5 -6 0 -6 Q 7.5 -6 6 ${f1(legs)}`}
                fill="none"
                stroke={FIG.bellDark}
                strokeWidth={3.2}
                strokeLinecap="round"
              />
            )}
            <circle cx={f1(bx)} cy={f1(by)} r={B.bellR} fill={FIG.bell} />
            <circle cx={f1(bx - 3.5)} cy={f1(by - 3.5)} r="3" fill={FIG.bellShine} />
          </g>
        );
      })}
    </svg>
  );
}

/** Convenience: the pose of `ex` at `phase` (0..1) in one view. */
export function ExerciseFigure({
  ex,
  view,
  phase,
  width,
  height,
  minimal,
}: {
  ex: Exercise;
  view: ViewName;
  phase: number;
  width: number;
  height: number;
  minimal?: boolean;
}) {
  return (
    <FigureView
      s={sampleSkeleton(ex.frames, phase)}
      view={view}
      box={viewBox(ex, view)}
      width={width}
      height={height}
      minimal={minimal}
    />
  );
}
