import { EXERCISES, getExercise } from "@/lib/exercises";
import { ExerciseFigure } from "@/lib/figure";
import { keyPhase, ogImage, OG_SIZE } from "@/lib/og";
import { SITE_NAME } from "@/lib/site";

export const alt = `${SITE_NAME} – free kettlebell workout planner and timer`;
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  const swing = getExercise("swing");
  return ogImage({
    title: "Kettlebell workout planner & timer",
    subtitle: `${EXERCISES.length} animated exercises · Rounds & AMRAP · One arm, two hands or two bells`,
    visual: <ExerciseFigure ex={swing} view="side" phase={keyPhase(swing)} width={340} height={425} />,
  });
}
