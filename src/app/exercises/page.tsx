import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORIES, EXERCISES, exerciseSlug, getVariants, isPrimary } from "@/lib/exercises";
import { abs, jsonLd, SITE_NAME } from "@/lib/site";
import { ExerciseDemo } from "@/components/ExerciseDemo";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

const TITLE = `Kettlebell Exercises: ${EXERCISES.length} Moves with Animated Demos`;
const DESCRIPTION = `The complete kettlebell exercise guide: ${EXERCISES.length} exercises – swings, cleans, presses, squats, rows, carries and core work – with animated front and side views, step-by-step form cues and common mistakes.`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/exercises" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/exercises" },
};

const CATEGORY_INTRO: Record<string, string> = {
  Ballistic: "Explosive hip-driven moves – the heart of kettlebell training for power and conditioning.",
  Strength: "Slow, heavy hinges that build the posterior chain and teach a solid hip hinge.",
  Legs: "Squats and lunges for quads, glutes and adductors.",
  "Upper Body": "Presses, rows, curls and extensions for shoulders, back and arms.",
  "Full Body": "Compound lifts and carries that train legs, trunk and arms together.",
  Core: "Anti-rotation, rotation and stability work for abs and obliques.",
};

export default function ExercisesPage() {
  const structured = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: TITLE,
        description: DESCRIPTION,
        url: abs("/exercises"),
        isPartOf: { "@id": abs("/#website") },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: SITE_NAME, item: abs("/") },
          { "@type": "ListItem", position: 2, name: "Exercises", item: abs("/exercises") },
        ],
      },
    ],
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(structured)} />
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-10">
        <nav aria-label="Breadcrumb" className="text-sm text-muted">
          <Link href="/" className="hover:text-ink">
            Home
          </Link>{" "}
          / <span className="text-ink">Exercises</span>
        </nav>
        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">Kettlebell exercise guide</h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink/80">
          {EXERCISES.length} kettlebell exercises with animated demos from the front and side. Each guide explains how to
          do the movement step by step, which muscles it works and which mistakes to avoid.
        </p>
        <nav aria-label="Categories" className="mt-6 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <a
              key={c}
              href={`#${c.toLowerCase().replace(/\s+/g, "-")}`}
              className="rounded-full border border-line px-3.5 py-1.5 text-sm text-muted hover:text-ink"
            >
              {c}
            </a>
          ))}
        </nav>

        {CATEGORIES.map((c) => {
          const list = EXERCISES.filter((e) => e.category === c);
          return (
            <section key={c} id={c.toLowerCase().replace(/\s+/g, "-")} className="mt-14 scroll-mt-20" aria-labelledby={`h-${c}`}>
              <h2 id={`h-${c}`} className="text-2xl font-bold">
                {c} kettlebell exercises
              </h2>
              <p className="mt-1 text-muted">{CATEGORY_INTRO[c]}</p>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((e) => (
                  <li key={e.id}>
                    <Link
                      href={`/exercises/${exerciseSlug(e)}`}
                      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-colors hover:border-accent/60"
                    >
                      <div className="aspect-[8/5] bg-linear-to-b from-surface-2 to-surface p-1">
                        <ExerciseDemo id={e.id} playing={false} phase={0.3} className="h-full w-full" />
                      </div>
                      <div className="flex flex-1 flex-col gap-1 p-4">
                        <h3 className="font-semibold leading-tight group-hover:text-accent-strong">{e.name}</h3>
                        <p className="text-sm text-muted">{e.subtitle}</p>
                        <p className="mt-auto pt-2 text-xs text-muted">
                          {e.difficulty} · {e.muscles.slice(0, 3).join(", ")}
                          {e.variant && isPrimary(e) && getVariants(e).length > 1 && ` · ${getVariants(e).length} grips`}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </main>
      <SiteFooter />
    </>
  );
}
