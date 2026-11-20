import { exerciseBySlug, EXERCISES, exerciseSlug, seoName } from "@/lib/exercises";
import { ExerciseFigure } from "@/lib/figure";
import { C, keyPhase, ogImage, OG_SIZE } from "@/lib/og";

export const alt = "Animated kettlebell exercise demo";
export const size = OG_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  return EXERCISES.map((e) => ({ slug: exerciseSlug(e) }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ex = exerciseBySlug(slug) ?? EXERCISES[0];
  const views = ex.views ?? ["front", "side"];
  const phase = keyPhase(ex, views.includes("side") ? "side" : views[0]);
  const name = seoName(ex);
  return ogImage({
    eyebrow: `${ex.category} · ${ex.difficulty}`,
    title: name,
    titleSize: name.length > 30 ? 56 : 66,
    subtitle: `Works: ${ex.muscles.slice(0, 4).join(", ")}`,
    footer: "How to do it · Form cues · Mistakes",
    visual: (
      <div style={{ display: "flex", gap: 8 }}>
        {views.slice(0, 2).map((v) => (
          <div
            key={v}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              background: C.surface,
              border: `2px solid ${C.line}`,
              borderRadius: 28,
              padding: "14px 6px 6px",
            }}
          >
            <div style={{ display: "flex", fontSize: 16, fontWeight: 700, color: C.muted, letterSpacing: 2, textTransform: "uppercase" }}>
              {v}
            </div>
            <ExerciseFigure ex={ex} view={v} phase={phase} width={210} height={262} />
          </div>
        ))}
      </div>
    ),
  });
}
