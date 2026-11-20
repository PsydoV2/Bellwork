import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  EXERCISES,
  exerciseBySlug,
  exerciseSlug,
  getVariants,
  seoName,
  usesTwoBells,
  type Exercise,
} from "@/lib/exercises";
import { abs, jsonLd, SITE_NAME } from "@/lib/site";
import { ExerciseDemo, ExerciseDemoPlayer } from "@/components/ExerciseDemo";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

export function generateStaticParams() {
  return EXERCISES.map((e) => ({ slug: exerciseSlug(e) }));
}

const list = (xs: string[]) =>
  xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;

function dosage(ex: Exercise) {
  const side = ex.unilateral ? " per side" : "";
  if (ex.defaultMode === "time") return `3–4 sets of 30–60 seconds${side}`;
  if (ex.category === "Ballistic") return `3–5 sets of ${ex.defaultReps}${side}, or 30–40 seconds of work in an interval`;
  if (ex.category === "Strength") return `3–5 sets of ${Math.max(5, ex.defaultReps - 4)}–${ex.defaultReps}${side}`;
  return `3–4 sets of ${ex.defaultReps}${side}`;
}

/** One-sentence, answer-first summary (used for the meta description and the quick answer). */
function summary(ex: Exercise) {
  const loading = usesTwoBells(ex) ? "two kettlebells" : ex.variant?.label === "One arm" || ex.unilateral ? "one kettlebell, one side at a time" : "one kettlebell";
  const level = ex.difficulty.toLowerCase();
  return `The ${seoName(ex).toLowerCase()} is ${/^[aeiou]/.test(level) ? "an" : "a"} ${level} ${ex.category.toLowerCase()} exercise with ${loading} that works the ${list(ex.muscles.map((m) => m.toLowerCase()))}.`;
}

export async function generateMetadata({ params }: PageProps<"/exercises/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const ex = exerciseBySlug(slug);
  if (!ex) return {};
  const title = `${seoName(ex)}: How to Do It, Muscles Worked & Mistakes`;
  const description = `${summary(ex)} Animated demo, ${ex.cues.length} form cues and the most common mistakes.`;
  return {
    title,
    description,
    alternates: { canonical: `/exercises/${slug}` },
    openGraph: { title, description, url: `/exercises/${slug}`, type: "article" },
  };
}

export default async function ExercisePage({ params }: PageProps<"/exercises/[slug]">) {
  const { slug } = await params;
  const ex = exerciseBySlug(slug);
  if (!ex) notFound();

  const variants = getVariants(ex);
  const related = EXERCISES.filter((e) => e.category === ex.category && e.id !== ex.id && !variants.includes(e)).slice(0, 6);
  const url = abs(`/exercises/${slug}`);
  const name = seoName(ex);

  const structured = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "HowTo",
        "@id": `${url}#howto`,
        name: `How to do the ${name}`,
        description: `${summary(ex)} ${ex.description}`,
        url,
        tool: [{ "@type": "HowToTool", name: usesTwoBells(ex) ? "Two kettlebells" : "Kettlebell" }],
        step: ex.cues.map((c, i) => ({ "@type": "HowToStep", position: i + 1, name: `Step ${i + 1}`, text: c })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: SITE_NAME, item: abs("/") },
          { "@type": "ListItem", position: 2, name: "Exercises", item: abs("/exercises") },
          { "@type": "ListItem", position: 3, name: ex.name, item: url },
        ],
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(structured)} />
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-8">
        <nav aria-label="Breadcrumb" className="text-sm text-muted">
          <Link href="/" className="hover:text-ink">
            Home
          </Link>{" "}
          /{" "}
          <Link href="/exercises" className="hover:text-ink">
            Exercises
          </Link>{" "}
          / <span className="text-ink">{ex.name}</span>
        </nav>

        <article className="mt-5">
          <header>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{name}</h1>
            <p className="mt-2 text-lg text-muted">{ex.subtitle}</p>
            <ul className="mt-4 flex flex-wrap gap-2 text-xs font-medium">
              <li className="rounded-full bg-accent/15 px-3 py-1 text-accent-strong">{ex.difficulty}</li>
              <li className="rounded-full bg-surface-2 px-3 py-1 text-muted">{ex.category}</li>
              {ex.variant && <li className="rounded-full bg-surface-2 px-3 py-1 text-muted">{ex.variant.label}</li>}
              {ex.unilateral && <li className="rounded-full bg-surface-2 px-3 py-1 text-muted">Each side</li>}
            </ul>
          </header>

          {variants.length > 1 && (
            <nav aria-label="Grip variations" className="mt-6 flex flex-wrap gap-2">
              {variants.map((v) => (
                <Link
                  key={v.id}
                  href={`/exercises/${exerciseSlug(v)}`}
                  aria-current={v.id === ex.id ? "page" : undefined}
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                    v.id === ex.id ? "border-ink bg-ink text-bg" : "border-line text-muted hover:text-ink"
                  }`}
                >
                  {v.variant!.label}
                </Link>
              ))}
            </nav>
          )}

          <div className="mt-6">
            <ExerciseDemoPlayer id={ex.id} />
          </div>

          <section aria-labelledby="answer" className="mt-8 rounded-3xl border border-line bg-surface p-6">
            <h2 id="answer" className="text-xs font-semibold uppercase tracking-wider text-muted">
              Quick answer
            </h2>
            <p className="mt-2 text-lg leading-relaxed">
              {summary(ex)} {ex.description}
            </p>
          </section>

          <div className="mt-10 grid gap-10 md:grid-cols-[1.4fr_1fr]">
            <section aria-labelledby="how">
              <h2 id="how" className="text-2xl font-bold">
                How to do the {name.replace(/^Kettlebell /, "kettlebell ")}
              </h2>
              <ol className="mt-5 space-y-3">
                {ex.cues.map((c, i) => (
                  <li key={c} className="flex gap-3 leading-relaxed">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-semibold text-accent-strong">
                      {i + 1}
                    </span>
                    {c}
                  </li>
                ))}
              </ol>
            </section>
            <div className="space-y-10">
              <section aria-labelledby="muscles">
                <h2 id="muscles" className="text-2xl font-bold">
                  Muscles worked
                </h2>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {ex.muscles.map((m) => (
                    <li key={m} className="rounded-full bg-surface-2 px-3 py-1 text-sm">
                      {m}
                    </li>
                  ))}
                </ul>
              </section>
              <section aria-labelledby="dose">
                <h2 id="dose" className="text-2xl font-bold">
                  Sets &amp; reps
                </h2>
                <p className="mt-3 leading-relaxed text-ink/80">
                  A good starting point is <strong>{dosage(ex)}</strong>
                  {usesTwoBells(ex) ? " with two bells of the same weight" : ""}. Use a weight that lets you keep perfect
                  form on the last rep.
                </p>
              </section>
            </div>
          </div>

          <section aria-labelledby="mistakes" className="mt-10">
            <h2 id="mistakes" className="text-2xl font-bold">
              Common mistakes
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {ex.mistakes.map((m) => (
                <li key={m} className="flex gap-3 rounded-2xl border border-line bg-surface p-4">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-danger" aria-hidden />
                  {m}
                </li>
              ))}
            </ul>
          </section>

          {variants.length > 1 && (
            <section aria-labelledby="variations" className="mt-10">
              <h2 id="variations" className="text-2xl font-bold">
                Variations: one arm, two hands or two bells
              </h2>
              <ul className="mt-4 space-y-2">
                {variants.map((v) => (
                  <li key={v.id}>
                    <Link href={`/exercises/${exerciseSlug(v)}`} className="font-semibold hover:text-accent-strong">
                      {v.name}
                    </Link>{" "}
                    <span className="text-muted">({v.variant!.label.toLowerCase()}) – {v.subtitle}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="mt-12 flex flex-col items-start gap-4 rounded-3xl bg-accent p-6 text-black sm:flex-row sm:items-center sm:p-8">
            <div className="flex-1">
              <h2 className="text-2xl font-bold">Add the {ex.name} to a workout</h2>
              <p className="mt-1 text-black/75">Plan rounds or an AMRAP and let the timer coach you through it.</p>
            </div>
            <Link href="/app" className="rounded-2xl bg-black px-6 py-3 font-semibold text-ink hover:bg-black/85">
              Open the planner
            </Link>
          </section>

          {related.length > 0 && (
            <section aria-labelledby="related" className="mt-14">
              <h2 id="related" className="text-2xl font-bold">
                More {ex.category.toLowerCase()} exercises
              </h2>
              <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {related.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`/exercises/${exerciseSlug(r)}`}
                      className="block overflow-hidden rounded-2xl border border-line bg-surface hover:border-accent/60"
                    >
                      <div className="aspect-[8/5] bg-surface-2 p-1">
                        <ExerciseDemo id={r.id} playing={false} phase={0.3} className="h-full w-full" />
                      </div>
                      <div className="p-3 text-sm font-semibold">{r.name}</div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
