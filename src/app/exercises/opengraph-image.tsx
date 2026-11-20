import { EXERCISES, getExercise } from "@/lib/exercises";
import { ExerciseFigure } from "@/lib/figure";
import { keyPhase, ogImage, OG_SIZE } from "@/lib/og";

export const alt = `Kettlebell exercise guide – ${EXERCISES.length} animated exercises`;
export const size = OG_SIZE;
export const contentType = "image/png";

const LINEUP = ["goblet-squat", "press", "snatch", "row"];

export default function Image() {
  return ogImage({
    eyebrow: "Exercise guide",
    title: `${EXERCISES.length} kettlebell exercises`,
    subtitle: "Animated front & side views, form cues and common mistakes",
    footer: "Swings · Cleans · Presses · Squats · Rows",
    titleSize: 64,
    visual: (
      <div style={{ display: "flex", alignItems: "flex-end" }}>
        {LINEUP.map((id) => {
          const ex = getExercise(id);
          return <ExerciseFigure key={id} ex={ex} view="side" phase={keyPhase(ex)} width={130} height={300} minimal />;
        })}
      </div>
    ),
  });
}
