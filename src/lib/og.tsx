import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { ReactNode } from "react";
import { ImageResponse } from "next/og";
import type { Exercise } from "./exercises";
import { project, sampleSkeleton, type ViewName } from "./skeleton";
import { SITE_NAME, SITE_URL } from "./site";

export const OG_SIZE = { width: 1200, height: 630 };

export const C = {
  bg: "#0d0e10",
  surface: "#16181b",
  line: "#2b2f35",
  ink: "#f3f1ec",
  muted: "#969ba3",
  accent: "#ff6a2b",
  accentStrong: "#ff8a50",
  bell: "#ff6a2b",
  bellDark: "#c9501b",
};

const fontDir = join(process.cwd(), "src/assets/fonts");
const fonts = Promise.all([
  readFile(join(fontDir, "Geist-Regular.ttf")),
  readFile(join(fontDir, "Geist-Bold.ttf")),
  readFile(join(fontDir, "Geist-ExtraBold.ttf")),
]).then(([regular, bold, extraBold]) => [
  { name: "Geist", data: regular, weight: 400 as const, style: "normal" as const },
  { name: "Geist", data: bold, weight: 700 as const, style: "normal" as const },
  { name: "Geist", data: extraBold, weight: 800 as const, style: "normal" as const },
]);

const HOST = SITE_URL.replace(/^https?:\/\//, "");

export function BellMark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <path d="M10 14 Q9 5 16 5 Q23 5 22 14" fill="none" stroke={C.bellDark} strokeWidth="3.5" />
      <circle cx="16" cy="20" r="9" fill={C.bell} />
      <circle cx="13" cy="17" r="2.5" fill="rgba(255,255,255,0.35)" />
    </svg>
  );
}

/**
 * Picks the most telling moment of an exercise for a still image: the phase where
 * the figure (incl. the bell) covers the most space in the given view.
 */
export function keyPhase(ex: Exercise, view: ViewName = "side") {
  let best = 0;
  let bestArea = -1;
  for (let i = 0; i < 24; i++) {
    const phase = i / 24;
    const s = sampleSkeleton(ex.frames, phase);
    const pts = [s.head, s.handR, s.handL, s.bellBody, s.ankleR, s.ankleL, s.kneeR, s.kneeL, s.pelvis];
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of pts) {
      const [x, y] = project(p, view);
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    }
    const area = (maxX - minX) * (maxY - minY);
    if (area > bestArea) {
      bestArea = area;
      best = phase;
    }
  }
  return best;
}

/** Shared 1200×630 frame: brand bar on top, text column left, visual right, domain at the bottom. */
export async function ogImage({
  eyebrow,
  title,
  subtitle,
  visual,
  footer,
  titleSize = 68,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  visual?: ReactNode;
  footer?: string;
  titleSize?: number;
}) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: `radial-gradient(circle at 85% 40%, #3a1a0c 0%, ${C.bg} 60%)`,
          color: C.ink,
          fontFamily: "Geist",
          padding: 64,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 34, fontWeight: 800, letterSpacing: -0.5 }}>
            <BellMark size={48} />
            {SITE_NAME}
          </div>
          <div style={{ display: "flex", fontSize: 24, color: C.muted }}>{HOST}</div>
        </div>
        <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", flex: 1, minWidth: 0, gap: 36 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 18, paddingRight: 24 }}>
              {eyebrow && (
                <div style={{ display: "flex", fontSize: 24, fontWeight: 700, color: C.accentStrong, textTransform: "uppercase", letterSpacing: 2 }}>
                  {eyebrow}
                </div>
              )}
              <div style={{ display: "flex", fontSize: titleSize, fontWeight: 800, lineHeight: 1.04, letterSpacing: -1.5 }}>{title}</div>
              {subtitle && <div style={{ display: "flex", fontSize: 28, color: C.muted, lineHeight: 1.35 }}>{subtitle}</div>}
            </div>
            <div style={{ display: "flex", fontSize: 24, fontWeight: 700, color: C.accentStrong }}>{footer ?? "Free · No sign-up"}</div>
          </div>
          {visual && <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center" }}>{visual}</div>}
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: await fonts },
  );
}
