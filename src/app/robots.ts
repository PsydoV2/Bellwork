import type { MetadataRoute } from "next";
import { abs, SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // search engines and AI answer engines are welcome to crawl everything
    rules: { userAgent: "*", allow: "/" },
    sitemap: abs("/sitemap.xml"),
    host: SITE_URL,
  };
}
