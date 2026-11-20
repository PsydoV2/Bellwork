import type { MetadataRoute } from "next";
import { SITE_NAME } from "@/lib/site";

/**
 * Web app manifest for the installable app. It lives under /app and is only
 * linked from the /app layout, so the landing page and exercise guide are not
 * part of the installed PWA.
 */
export function GET() {
  const manifest: MetadataRoute.Manifest = {
    id: "/app",
    name: SITE_NAME,
    short_name: "KB Coach",
    description: "Plan kettlebell workouts and train with a voice-guided interval timer – works offline.",
    start_url: "/app",
    scope: "/app",
    display: "standalone",
    orientation: "any",
    background_color: "#0d0e10",
    theme_color: "#0d0e10",
    categories: ["fitness", "health", "sports"],
    icons: [
      { src: "/app/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/app/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/app/icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
  return new Response(JSON.stringify(manifest), {
    headers: { "Content-Type": "application/manifest+json" },
  });
}
