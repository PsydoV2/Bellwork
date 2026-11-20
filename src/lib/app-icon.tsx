import { ImageResponse } from "next/og";

const BG = "#0d0e10";
const BELL = "#ff6a2b";
const BELL_DARK = "#c9501b";

/**
 * Renders the app icon (kettlebell on dark ground) as a PNG.
 * `maskable` keeps the bell inside the ~80% safe zone and fills the full square,
 * because Android crops maskable icons into circles/squircles.
 */
export function renderAppIcon(size: number, { maskable = false } = {}) {
  const bell = Math.round(size * (maskable ? 0.52 : 0.68));
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: BG,
        }}
      >
        <svg width={bell} height={bell} viewBox="0 0 32 32">
          <path d="M10 14 Q9 5 16 5 Q23 5 22 14" fill="none" stroke={BELL_DARK} strokeWidth="3.5" />
          <circle cx="16" cy="20" r="9" fill={BELL} />
          <circle cx="13" cy="17" r="2.5" fill="rgba(255,255,255,0.35)" />
        </svg>
      </div>
    ),
    { width: size, height: size },
  );
}
