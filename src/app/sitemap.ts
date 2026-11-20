import type { MetadataRoute } from "next";
import { EXERCISES, exerciseSlug } from "@/lib/exercises";
import { abs } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: abs("/"), changeFrequency: "monthly", priority: 1 },
    { url: abs("/exercises"), changeFrequency: "monthly", priority: 0.9 },
    { url: abs("/app"), changeFrequency: "monthly", priority: 0.7 },
    ...EXERCISES.map((e) => ({
      url: abs(`/exercises/${exerciseSlug(e)}`),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
