"use client";

/*
 * Backend-free sharing: plans are packed into a compact JSON tuple format, deflated (when the
 * browser supports CompressionStream) and base64url-encoded into the URL fragment, e.g.
 * https://example.com/app#w=z…  – the fragment is never sent to a server.
 */

import { EXERCISE_MAP } from "./exercises";
import { addPlans, DEFAULT_TIME_CAP, getPlans, uid, type WorkoutItem, type WorkoutPlan } from "./store";

export const SHARE_PARAM = "w";
const VERSION = 1;

/** [exerciseId, mode (0 reps / 1 time), reps, duration, weight, rest] */
type ItemTuple = [string, 0 | 1, number, number, number, number];
/** [name, format (0 rounds / 1 amrap), rounds, roundRest, timeCap, items] */
type PlanTuple = [string, 0 | 1, number, number, number, ItemTuple[]];
type Payload = [number, PlanTuple[]];

/** A plan without ids / history – what travels in a share link. */
export type SharedPlan = Pick<WorkoutPlan, "name" | "format" | "rounds" | "roundRest" | "timeCap" | "items">;

function toTuple(p: WorkoutPlan | SharedPlan): PlanTuple {
  return [
    p.name,
    p.format === "amrap" ? 1 : 0,
    p.rounds,
    p.roundRest,
    p.format === "amrap" ? (p.timeCap ?? DEFAULT_TIME_CAP) : 0,
    p.items.map((i) => [i.exerciseId, i.mode === "time" ? 1 : 0, i.reps, i.duration, i.weight, i.rest]),
  ];
}

/** Stable fingerprint of a plan's content, used to skip plans the device already has. */
export function planFingerprint(p: WorkoutPlan | SharedPlan): string {
  return JSON.stringify(toTuple(p));
}

// ---------- validation (links are untrusted input) ----------

const num = (v: unknown, min: number, max: number, fallback: number) =>
  typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;

function fromTuple(t: unknown): SharedPlan | null {
  if (!Array.isArray(t) || t.length < 6 || !Array.isArray(t[5])) return null;
  const items: WorkoutItem[] = [];
  for (const it of t[5] as unknown[]) {
    if (!Array.isArray(it) || typeof it[0] !== "string" || !EXERCISE_MAP[it[0]]) continue;
    items.push({
      id: uid(),
      exerciseId: it[0],
      mode: it[1] === 1 ? "time" : "reps",
      reps: Math.round(num(it[2], 1, 500, 10)),
      duration: Math.round(num(it[3], 1, 3600, 40)),
      weight: num(it[4], 0, 200, 12),
      rest: Math.round(num(it[5], 0, 3600, 30)),
    });
    if (items.length >= 100) break;
  }
  if (items.length === 0) return null;
  const amrap = t[1] === 1;
  return {
    name: (typeof t[0] === "string" ? t[0] : "").trim().slice(0, 100) || "Shared workout",
    format: amrap ? "amrap" : "rounds",
    rounds: amrap ? 1 : Math.round(num(t[2], 1, 100, 3)),
    roundRest: Math.round(num(t[3], 0, 3600, 60)),
    timeCap: amrap ? Math.round(num(t[4], 60, 4 * 3600, DEFAULT_TIME_CAP)) : undefined,
    items,
  };
}

// ---------- byte helpers ----------

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

const canCompress = () => typeof CompressionStream !== "undefined" && typeof DecompressionStream !== "undefined";

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Blob([bytes as BlobPart]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

// ---------- public API ----------

/** Encodes plans into the fragment value: "z…" = deflate-raw, "j…" = plain JSON. */
export async function encodePlans(plans: (WorkoutPlan | SharedPlan)[]): Promise<string> {
  const payload: Payload = [VERSION, plans.map(toTuple)];
  const json = new TextEncoder().encode(JSON.stringify(payload));
  if (canCompress()) {
    try {
      return "z" + toBase64Url(await pipe(json, new CompressionStream("deflate-raw")));
    } catch {
      /* fall through */
    }
  }
  return "j" + toBase64Url(json);
}

export async function decodePlans(code: string): Promise<SharedPlan[] | null> {
  try {
    const kind = code[0];
    let bytes = fromBase64Url(code.slice(1));
    if (kind === "z") {
      if (!canCompress()) return null;
      bytes = await pipe(bytes, new DecompressionStream("deflate-raw"));
    } else if (kind !== "j") return null;
    const data = JSON.parse(new TextDecoder().decode(bytes)) as unknown;
    if (!Array.isArray(data) || data[0] !== VERSION || !Array.isArray(data[1])) return null;
    const plans = (data[1] as unknown[]).slice(0, 50).map(fromTuple).filter((p): p is SharedPlan => p !== null);
    return plans.length ? plans : null;
  } catch {
    return null;
  }
}

export async function shareUrl(plans: (WorkoutPlan | SharedPlan)[]): Promise<string> {
  return `${window.location.origin}/app/#${SHARE_PARAM}=${await encodePlans(plans)}`;
}

/** Extracts the share code from a full link, a bare fragment ("#w=…") or the code itself. */
export function extractCode(input: string): string | null {
  const s = input.trim();
  const m = s.match(new RegExp(`[#&]${SHARE_PARAM}=([A-Za-z0-9_-]+)`));
  if (m) return m[1];
  return /^[zj][A-Za-z0-9_-]+$/.test(s) ? s : null;
}

/** Plans from `shared` this device doesn't already have (same content = same plan). */
export function newOnly(shared: SharedPlan[]): SharedPlan[] {
  const have = new Set(getPlans().map(planFingerprint));
  const seen = new Set<string>();
  return shared.filter((p) => {
    const f = planFingerprint(p);
    if (have.has(f) || seen.has(f)) return false;
    seen.add(f);
    return true;
  });
}

/** Saves shared plans as new local plans; returns how many were added. */
export function importShared(shared: SharedPlan[]): number {
  const fresh = newOnly(shared);
  const now = Date.now();
  addPlans(
    fresh.map((p, i) => ({
      ...p,
      id: uid(),
      createdAt: now + i,
      items: p.items.map((it) => ({ ...it, id: uid() })),
    })),
  );
  return fresh.length;
}

/** Whether the system share sheet is worth offering (phones / tablets). */
export function canNativeShare(): boolean {
  return typeof navigator.share === "function" && window.matchMedia("(pointer: coarse)").matches;
}

/** Opens the system share sheet; resolves false if it failed or was dismissed. */
export async function nativeShare(url: string, title: string): Promise<boolean> {
  try {
    await navigator.share({ title, url });
    return true;
  } catch {
    return false;
  }
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
