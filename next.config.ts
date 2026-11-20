import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // fully static site: `next build` writes plain HTML/CSS/JS (+ prerendered icons, OG images, sitemap…) to ./out
  output: "export",
  // Cache Components / Partial Prefetching are request-time features with no effect in a static export
  // (and they forbid the `dynamic = "force-static"` that exported route handlers need).
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Note: `headers()` is not supported with a static export. The service worker
  // (/app-sw.js) must be served with `Cache-Control: no-cache` by the host – see public/_headers.
};

export default nextConfig;
