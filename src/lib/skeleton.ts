/**
 * 3D stick-figure skeleton used for the exercise animations.
 *
 * World coordinates (centimetres, roughly a 178 cm person):
 *   x = the figure's RIGHT side, y = up (floor at y = 0), z = the direction the figure faces.
 *
 * Keyframes are authored as targets (pelvis position, torso angles, hand/foot targets) and
 * solved with two-bone inverse kinematics, so every view (front / side / top) is a projection
 * of the very same 3D pose.
 */

export type V3 = [number, number, number];
/** "double" = one bell in each hand (the left bell mirrors `bellDir` unless `bellDirL` is given). */
export type Hold = "both" | "R" | "L" | "floor" | "double";
export type ViewName = "front" | "side" | "top";

/** Body dimensions */
export const B = {
  hipHalf: 10,
  spine: 52,
  shoulderHalf: 17,
  shoulderDrop: 3,
  neckToHead: 19,
  headR: 11,
  thigh: 44,
  shin: 44,
  upperArm: 30,
  forearm: 33, // elbow to grip
  foot: 17,
  bellR: 10.5,
  bellOffset: 13, // grip (handle) to centre of the bell body
  gripHalf: 5, // half distance between hands on the horns
};

export const ARM = B.upperArm + B.forearm;
export const LEG = B.thigh + B.shin;

export interface Frame {
  pelvis: V3;
  pelvisYaw?: number;
  /** degrees. pitch + = bend forward, yaw + = turn to the right (world vertical axis),
   *  roll + = side-bend to the right, twist + = rotate chest to the right around the spine. */
  torso?: { pitch?: number; yaw?: number; roll?: number; twist?: number };
  footR: V3;
  footL: V3;
  /** foot direction (ankle -> toes) */
  toeR?: V3;
  toeL?: V3;
  handR?: V3;
  handL?: V3;
  /** Who holds the bell. "both" = both hands on the handle/horns (positions come from `bell` + `axis`). */
  hold: Hold;
  /** Handle position for hold "both" / "floor". */
  bell?: V3;
  /** Direction from the handle to the bell body. Default: hanging down. */
  bellDir?: V3;
  /** Direction of the left-hand bell for hold "double". Default: `bellDir` mirrored. */
  bellDirL?: V3;
  /** Handle axis (left hand -> right hand) for hold "both". */
  axis?: V3;
  /** IK pole vectors: the direction the elbow / knee points to. */
  elbowR?: V3;
  elbowL?: V3;
  kneeR?: V3;
  kneeL?: V3;
  /** Relative time the pose is held still. */
  pause?: number;
  /** Relative time of the movement from this keyframe to the next. Default 1. */
  w?: number;
}

/** Fully resolved, purely numeric keyframe (interpolatable). */
interface RFrame {
  n: number[];
  hold: Hold;
}

const KEYS3 = [
  "pelvis",
  "footR",
  "footL",
  "toeR",
  "toeL",
  "handR",
  "handL",
  "bellPos",
  "bellDir",
  "bellDirL",
  "elbowR",
  "elbowL",
  "kneeR",
  "kneeL",
] as const;
const KEYS1 = ["pelvisYaw", "pitch", "yaw", "roll", "twist"] as const;
type K3 = (typeof KEYS3)[number];
type K1 = (typeof KEYS1)[number];
type Flat = Record<K3, V3> & Record<K1, number>;

// ---------- vector helpers ----------
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const len = (a: V3) => Math.hypot(a[0], a[1], a[2]);
const norm = (a: V3): V3 => {
  const l = len(a);
  return l < 1e-9 ? [0, -1, 0] : mul(a, 1 / l);
};
const cross = (a: V3, b: V3): V3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
export const dist = (a: V3, b: V3) => len(sub(a, b));
const rad = (d: number) => (d * Math.PI) / 180;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function rotY(v: V3, deg: number): V3 {
  const c = Math.cos(rad(deg));
  const s = Math.sin(rad(deg));
  return [v[0] * c + v[2] * s, v[1], -v[0] * s + v[2] * c];
}
function rotX(v: V3, deg: number): V3 {
  const c = Math.cos(rad(deg));
  const s = Math.sin(rad(deg));
  return [v[0], v[1] * c - v[2] * s, v[1] * s + v[2] * c];
}
function rotZ(v: V3, deg: number): V3 {
  const c = Math.cos(rad(deg));
  const s = Math.sin(rad(deg));
  return [v[0] * c + v[1] * s, -v[0] * s + v[1] * c, v[2]];
}

function torsoRot(f: Flat, v: V3): V3 {
  return rotY(rotX(rotZ(rotY(v, f.twist), f.roll), f.pitch), f.yaw);
}

/** Two-bone IK in 3D. Returns the middle joint and the (reachable) end point. */
function ik(root: V3, target: V3, l1: number, l2: number, pole: V3) {
  const d = sub(target, root);
  const n = norm(d);
  const dd = clamp(len(d), Math.abs(l1 - l2) + 0.01, l1 + l2 - 0.01);
  const cosA = clamp((l1 * l1 + dd * dd - l2 * l2) / (2 * l1 * dd), -1, 1);
  const along = l1 * cosA;
  const h = Math.sqrt(Math.max(0, l1 * l1 - along * along));
  let p = sub(pole, mul(n, dot(pole, n)));
  if (len(p) < 1e-6) p = cross(n, [1, 0, 0]);
  if (len(p) < 1e-6) p = cross(n, [0, 0, 1]);
  p = norm(p);
  const joint = add(add(root, mul(n, along)), mul(p, h));
  const end = add(root, mul(n, dd));
  return { joint, end };
}

// ---------- resolving authored frames ----------
function resolve(f: Frame): RFrame {
  const axis = norm(f.axis ?? [1, 0, 0]);
  let handR = f.handR;
  let handL = f.handL;
  if (f.hold === "both") {
    if (!f.bell) throw new Error("hold 'both' requires bell");
    handR = add(f.bell, mul(axis, B.gripHalf));
    handL = sub(f.bell, mul(axis, B.gripHalf));
  }
  if (!handR || !handL) throw new Error("hands missing");
  const bellPos: V3 =
    f.hold === "both" || f.hold === "floor" ? f.bell! : f.hold === "L" ? handL : handR;
  const bellDir: V3 = f.bellDir ?? [0, -1, 0];
  const flat: Flat = {
    pelvis: f.pelvis,
    footR: f.footR,
    footL: f.footL,
    toeR: f.toeR ?? [0.22, -0.35, 1],
    toeL: f.toeL ?? [-0.22, -0.35, 1],
    handR,
    handL,
    bellPos,
    bellDir,
    bellDirL: f.bellDirL ?? [-bellDir[0], bellDir[1], bellDir[2]],
    elbowR: f.elbowR ?? [0.45, -0.25, -1],
    elbowL: f.elbowL ?? [-0.45, -0.25, -1],
    kneeR: f.kneeR ?? [0.2, 0, 1],
    kneeL: f.kneeL ?? [-0.2, 0, 1],
    pelvisYaw: f.pelvisYaw ?? 0,
    pitch: f.torso?.pitch ?? 0,
    yaw: f.torso?.yaw ?? 0,
    roll: f.torso?.roll ?? 0,
    twist: f.torso?.twist ?? 0,
  };
  const n: number[] = [];
  for (const k of KEYS3) n.push(...flat[k]);
  for (const k of KEYS1) n.push(flat[k]);
  return { n, hold: f.hold };
}

function unflatten(n: number[]): Flat {
  const out = {} as Flat;
  let i = 0;
  for (const k of KEYS3) {
    out[k] = [n[i], n[i + 1], n[i + 2]];
    i += 3;
  }
  for (const k of KEYS1) out[k] = n[i++];
  return out;
}

// ---------- skeleton ----------
export interface Skeleton {
  pelvis: V3;
  hipR: V3;
  hipL: V3;
  neck: V3;
  head: V3;
  shoulderR: V3;
  shoulderL: V3;
  elbowR: V3;
  elbowL: V3;
  handR: V3;
  handL: V3;
  kneeR: V3;
  kneeL: V3;
  ankleR: V3;
  ankleL: V3;
  toeR: V3;
  toeL: V3;
  bell: V3; // handle
  bellBody: V3;
  /** Second bell (left hand) for hold "double". */
  bell2?: V3;
  bellBody2?: V3;
}

function solveFlat(f: Flat): Omit<Skeleton, "bell" | "bellBody"> {
  const P = f.pelvis;
  const hipR = add(P, rotY([B.hipHalf, 0, 0], f.pelvisYaw));
  const hipL = add(P, rotY([-B.hipHalf, 0, 0], f.pelvisYaw));
  const neck = add(P, torsoRot(f, [0, B.spine, 0]));
  const head = add(P, torsoRot(f, [0, B.spine + B.neckToHead, 1]));
  const shoulderR = add(P, torsoRot(f, [B.shoulderHalf, B.spine - B.shoulderDrop, 0]));
  const shoulderL = add(P, torsoRot(f, [-B.shoulderHalf, B.spine - B.shoulderDrop, 0]));
  const armR = ik(shoulderR, f.handR, B.upperArm, B.forearm, f.elbowR);
  const armL = ik(shoulderL, f.handL, B.upperArm, B.forearm, f.elbowL);
  const legR = ik(hipR, f.footR, B.thigh, B.shin, f.kneeR);
  const legL = ik(hipL, f.footL, B.thigh, B.shin, f.kneeL);
  return {
    pelvis: P,
    hipR,
    hipL,
    neck,
    head,
    shoulderR,
    shoulderL,
    elbowR: armR.joint,
    elbowL: armL.joint,
    handR: armR.end,
    handL: armL.end,
    kneeR: legR.joint,
    kneeL: legL.joint,
    ankleR: legR.end,
    ankleL: legL.end,
    toeR: add(legR.end, mul(norm(f.toeR), B.foot)),
    toeL: add(legL.end, mul(norm(f.toeL), B.foot)),
  };
}

function bellFrom(s: Omit<Skeleton, "bell" | "bellBody">, hold: Hold, f: Flat): V3 {
  if (hold === "R" || hold === "double") return s.handR;
  if (hold === "L") return s.handL;
  if (hold === "both") return mul(add(s.handR, s.handL), 0.5);
  return f.bellPos;
}

// ---------- animation clip ----------
export interface Clip {
  frames: RFrame[];
  pauses: number[];
  weights: number[];
  total: number;
  /** bell handle position of every solved keyframe (used when the holder changes) */
  keyBells: V3[];
}

const clipCache = new WeakMap<Frame[], Clip>();

export function getClip(frames: Frame[]): Clip {
  const cached = clipCache.get(frames);
  if (cached) return cached;
  const r = frames.map(resolve);
  const pauses = frames.map((f) => f.pause ?? 0);
  const weights = frames.map((f) => f.w ?? 1);
  const total = pauses.reduce((a, b) => a + b, 0) + weights.reduce((a, b) => a + b, 0);
  const keyBells = r.map((fr) => {
    const flat = unflatten(fr.n);
    return bellFrom(solveFlat(flat), fr.hold, flat);
  });
  const clip = { frames: r, pauses, weights, total, keyBells };
  clipCache.set(frames, clip);
  return clip;
}

function catmull(p0: number, p1: number, p2: number, p3: number, t: number) {
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    0.5 *
    (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  );
}

const same = (a: number[], b: number[]) => a.every((v, i) => Math.abs(v - b[i]) < 1e-6);

/** Sample the clip at phase in [0, 1). */
export function sampleSkeleton(frames: Frame[], phase: number, mirrored = false): Skeleton {
  const clip = getClip(frames);
  const n = clip.frames.length;
  let time = (((phase % 1) + 1) % 1) * clip.total;
  let i = 0;
  let t = 0;
  let moving = false;
  for (i = 0; i < n; i++) {
    if (time < clip.pauses[i]) break;
    time -= clip.pauses[i];
    if (time < clip.weights[i]) {
      t = time / clip.weights[i];
      moving = true;
      break;
    }
    time -= clip.weights[i];
  }
  if (i >= n) i = n - 1;
  const a = clip.frames[i];
  const b = clip.frames[(i + 1) % n];
  let nums: number[];
  if (!moving || same(a.n, b.n)) {
    nums = a.n;
  } else {
    const p0 = clip.frames[(i - 1 + n) % n].n;
    const p3 = clip.frames[(i + 2) % n].n;
    nums = a.n.map((v, k) => catmull(p0[k], v, b.n[k], p3[k], t));
  }
  const flat = unflatten(nums);
  const s = solveFlat(flat);

  let bell: V3;
  if (!moving || a.hold === b.hold) {
    bell = bellFrom(s, a.hold, flat);
  } else {
    const ka = clip.keyBells[i];
    const kb = clip.keyBells[(i + 1) % n];
    bell = add(ka, mul(sub(kb, ka), t));
  }
  const bellBody = add(bell, mul(norm(flat.bellDir), B.bellOffset));
  const full: Skeleton = { ...s, bell, bellBody };
  if (a.hold === "double" || b.hold === "double") {
    full.bell2 = s.handL;
    full.bellBody2 = add(s.handL, mul(norm(flat.bellDirL), B.bellOffset));
  }
  return mirrored ? mirror(full) : full;
}

function mirror(s: Skeleton): Skeleton {
  const m = (v: V3): V3 => [-v[0], v[1], v[2]];
  if (s.bell2 && s.bellBody2) {
    // two bells: swap them so `bell` stays in the (new) right hand
    const out = mirrorBody(s, m);
    return { ...out, bell: m(s.bell2), bellBody: m(s.bellBody2), bell2: m(s.bell), bellBody2: m(s.bellBody) };
  }
  return mirrorBody(s, m);
}

function mirrorBody(s: Skeleton, m: (v: V3) => V3): Skeleton {
  return {
    pelvis: m(s.pelvis),
    hipR: m(s.hipL),
    hipL: m(s.hipR),
    neck: m(s.neck),
    head: m(s.head),
    shoulderR: m(s.shoulderL),
    shoulderL: m(s.shoulderR),
    elbowR: m(s.elbowL),
    elbowL: m(s.elbowR),
    handR: m(s.handL),
    handL: m(s.handR),
    kneeR: m(s.kneeL),
    kneeL: m(s.kneeR),
    ankleR: m(s.ankleL),
    ankleL: m(s.ankleR),
    toeR: m(s.toeL),
    toeL: m(s.toeR),
    bell: m(s.bell),
    bellBody: m(s.bellBody),
  };
}

// ---------- projection ----------
/** Returns [screenX, screenY, depth]; larger depth = closer to the camera. */
export function project(v: V3, view: ViewName): [number, number, number] {
  switch (view) {
    case "front": // camera in front of the figure: the figure's right appears on the left
      return [-v[0], -v[1], v[2]];
    case "side": // camera at the figure's right side: the figure faces to the right
      return [v[2], -v[1], v[0]];
    case "top": // camera above, head towards the top of the screen for lying exercises
      return [-v[0], v[2], v[1]];
  }
}
