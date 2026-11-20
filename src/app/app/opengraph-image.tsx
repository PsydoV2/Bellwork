import { getExercise } from "@/lib/exercises";
import { ExerciseFigure } from "@/lib/figure";
import { C, keyPhase, ogImage, OG_SIZE } from "@/lib/og";
import { SITE_NAME } from "@/lib/site";

export const alt = `${SITE_NAME} app – kettlebell workout planner and interval timer`;
export const size = OG_SIZE;
export const contentType = "image/png";

/** A mock of the workout player: progress ring with the countdown around the figure. */
export default function Image() {
  const ex = getExercise("goblet-squat");
  const r = 180;
  const circ = 2 * Math.PI * r;
  return ogImage({
    eyebrow: "Workout planner & timer",
    title: "Plan it. Swing it. Track it.",
    subtitle: "Voice-guided intervals, AMRAP & rounds – installable, works offline",
    visual: (
      <div style={{ display: "flex", position: "relative", width: 400, height: 400, alignItems: "center", justifyContent: "center" }}>
        <svg width="400" height="400" viewBox="0 0 400 400" style={{ position: "absolute", top: 0, left: 0 }}>
          <circle cx="200" cy="200" r={r} fill="none" stroke={C.line} strokeWidth="14" />
          <circle
            cx="200"
            cy="200"
            r={r}
            fill="none"
            stroke={C.accent}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${circ * 0.68} ${circ}`}
            transform="rotate(-90 200 200)"
          />
        </svg>
        <div style={{ display: "flex", position: "absolute", top: 52, left: 0, width: 400, justifyContent: "center" }}>
          <ExerciseFigure ex={ex} view="front" phase={keyPhase(ex, "front")} width={170} height={212} minimal />
        </div>
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: 262,
            left: 0,
            width: 400,
            justifyContent: "center",
            fontSize: 56,
            fontWeight: 800,
            letterSpacing: -1,
          }}
        >
          0:27
        </div>
      </div>
    ),
  });
}
