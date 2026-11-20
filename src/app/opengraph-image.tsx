import { ImageResponse } from "next/og";
import { EXERCISES } from "@/lib/exercises";
import { SITE_NAME } from "@/lib/site";

export const alt = `${SITE_NAME} – free kettlebell workout planner and timer`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(135deg, #0d0e10 55%, #3a1a0c 100%)",
          color: "#f3f1ec",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 36, fontWeight: 700 }}>
          <div style={{ display: "flex", width: 56, height: 56, borderRadius: 999, background: "#ff6a2b" }} />
          {SITE_NAME}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05, maxWidth: 950 }}>
            Kettlebell workout planner & timer
          </div>
          <div style={{ fontSize: 34, color: "#969ba3" }}>
            {`${EXERCISES.length} animated exercises · Rounds & AMRAP · One arm, two hands or two bells`}
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 28, color: "#ff8a50", fontWeight: 600 }}>Free · No sign-up</div>
      </div>
    ),
    size,
  );
}
