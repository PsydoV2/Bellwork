import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // fully static site: `next build` writes plain HTML/CSS/JS (+ prerendered icons, OG images, sitemap…) to ./out
  output: "export",
  // emit /app/index.html instead of /app.html: /app/ is also a folder (icons, manifest), and static
  // hosts answer a folder without index.html with 403 Forbidden
  trailingSlash: true,
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
