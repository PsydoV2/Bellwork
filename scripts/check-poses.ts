/* Sanity checks for every exercise animation: run with `npx tsx scripts/check-poses.ts [ids...]` */
import { EXERCISES } from "../src/lib/exercises";
import { ARM, B, LEG, dist, sampleSkeleton, type Frame, type V3 } from "../src/lib/skeleton";

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
function segDist(p: V3, a: V3, b: V3) {
  const ab = sub(b, a);
  const t = Math.max(0, Math.min(1, dot(sub(p, a), ab) / dot(ab, ab)));
  return dist(p, [a[0] + ab[0] * t, a[1] + ab[1] * t, a[2] + ab[2] * t]);
}

const only = process.argv.slice(2);
let problems = 0;
for (const ex of EXERCISES.filter((e) => !only.length || only.includes(e.id))) {
  const issues = new Set<string>();
  // keyframe reach (targets must be reachable, otherwise the IK clamps them)
  ex.frames.forEach((f: Frame, i) => {
    const s = sampleSkeleton([f], 0);
    const tR = f.hold === "both" ? null : f.handR;
    const reachR = dist(s.shoulderR, s.handR);
    const reachL = dist(s.shoulderL, s.handL);
    if (reachR > ARM - 0.2 && tR && dist(s.handR, tR) > 1) issues.add(`kf${i}: right hand target out of reach (${dist(s.shoulderR, tR).toFixed(1)} > ${ARM})`);
    if (f.hold === "both") {
      const hr = s.handR, hl = s.handL;
      if (reachR > ARM - 0.2 || reachL > ARM - 0.2) {
        const mid: V3 = [(hr[0] + hl[0]) / 2, (hr[1] + hl[1]) / 2, (hr[2] + hl[2]) / 2];
        if (f.bell && dist(mid, f.bell) > 1) issues.add(`kf${i}: bell target out of reach (miss ${dist(mid, f.bell).toFixed(1)})`);
      }
    } else if (f.handL && reachL > ARM - 0.2 && dist(s.handL, f.handL) > 1) {
      issues.add(`kf${i}: left hand target out of reach (${dist(s.shoulderL, f.handL).toFixed(1)})`);
    }
    if (dist(s.hipR, f.footR) > LEG - 0.01) issues.add(`kf${i}: right foot out of reach (${dist(s.hipR, f.footR).toFixed(1)})`);
    if (dist(s.hipL, f.footL) > LEG - 0.01) issues.add(`kf${i}: left foot out of reach (${dist(s.hipL, f.footL).toFixed(1)})`);
  });

  // sampled collisions
  for (let k = 0; k < 96; k++) {
    const s0 = sampleSkeleton(ex.frames, k / 96);
    const tag = `t=${(k / 96).toFixed(2)}`;
    if (s0.bellBody2 && dist(s0.bellBody, s0.bellBody2) < 2 * B.bellR - 1)
      issues.add(`${tag}: bells collide (${dist(s0.bellBody, s0.bellBody2).toFixed(1)})`);
    for (const s of [s0, ...(s0.bellBody2 ? [{ ...s0, bellBody: s0.bellBody2 }] : [])]) {
    const headClear = dist(s.bellBody, s.head);
    if (headClear < B.headR + B.bellR - 1) issues.add(`${tag}: bell hits head (${headClear.toFixed(1)})`);
    for (const [n, h] of [["R", s.handR], ["L", s.handL]] as const)
      if (dist(h, s.head) < B.headR + 1) issues.add(`${tag}: ${n} hand inside head`);
    if (s.bellBody[1] - B.bellR < -1.5) issues.add(`${tag}: bell below floor (${(s.bellBody[1] - B.bellR).toFixed(1)})`);
    const torso = segDist(s.bellBody, s.pelvis, s.neck);
    if (torso < B.bellR + 4) issues.add(`${tag}: bell inside torso (${torso.toFixed(1)})`);
    for (const [n, p] of Object.entries({ kneeR: s.kneeR, kneeL: s.kneeL, elbowR: s.elbowR, elbowL: s.elbowL, toeR: s.toeR, toeL: s.toeL, ankleR: s.ankleR, ankleL: s.ankleL }))
      if (p[1] < -1.5) issues.add(`${tag}: ${n} below floor (${p[1].toFixed(1)})`);
    for (const [n, a, b] of [
      ["R thigh", s.hipR, s.kneeR],
      ["L thigh", s.hipL, s.kneeL],
    ] as const) {
      const d = segDist(s.bellBody, a, b);
      if (d < B.bellR + 2) issues.add(`${tag}: bell inside ${n} (${d.toFixed(1)})`);
    }
    }
  }
  if (issues.size) {
    problems += issues.size;
    console.log(`\n${ex.id}`);
    // collapse repeated sample warnings
    const list = [...issues];
    const shown = new Map<string, number>();
    for (const m of list) {
      const key = m.replace(/^t=[\d.]+: /, "").replace(/\(.*\)/, "");
      shown.set(key, (shown.get(key) ?? 0) + 1);
      if (shown.get(key)! <= 2) console.log("  " + m);
    }
  }
}
console.log(`\n${problems} issue(s)`);
