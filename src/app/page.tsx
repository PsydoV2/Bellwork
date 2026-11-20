import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORIES, EXERCISES, exerciseSlug, getExercise, getVariants, isPrimary } from "@/lib/exercises";
import { abs, FAQ, jsonLd, SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from "@/lib/site";
import { ExerciseDemo, HeroDemo } from "@/components/ExerciseDemo";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

const TITLE = `${SITE_NAME} – Free Kettlebell Workout Planner, Timer & AMRAP App`;

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: { title: TITLE, description: SITE_DESCRIPTION, url: "/" },
};

const href = (id: string) => `/exercises/${exerciseSlug(getExercise(id))}`;

const FEATURES = [
  {
    title: "Animated demos, front & side",
    text: "Every exercise is a 3D-animated figure shown from two angles, so you can check hip hinge, knee track and bell path at a glance.",
  },
  {
    title: "Fixed rounds or AMRAP",
    text: "Run classic rounds with rest after every exercise, or set a time cap and chase as many rounds as possible.",
  },
  {
    title: "One arm, two hands, two bells",
    text: "Switch rows, presses, cleans, squats, curls and carries between single-arm, two-hand and double-kettlebell versions.",
  },
  {
    title: "Voice coach & countdown",
    text: "Spoken cues announce every exercise and side, beeps count down the last seconds, and the screen stays awake.",
  },
  {
    title: "Reps or time per exercise",
    text: "Set reps or work time, weight and rest for each exercise. Single-side moves automatically run left and right.",
  },
  {
    title: "No account, no ads",
    text: "Plans and personal bests are stored in your browser. Open the app and start training in seconds.",
  },
];

const WORKOUTS = [
  {
    name: "20-Minute AMRAP",
    format: "AMRAP · 20 min",
    items: ["15 swings", "10 goblet squats", "10 two-hand rows", "5 push presses / side", "30 s farmer's carry"],
  },
  {
    name: "Beginner Full Body",
    format: "3 rounds · ~15 min",
    items: ["10 deadlifts", "10 goblet squats", "8 bent-over rows / side", "6 overhead presses / side", "30 s swings"],
  },
  {
    name: "Swing HIIT",
    format: "5 rounds · ~15 min",
    items: ["40 s swings", "40 s goblet squats", "30 s sumo high pulls"],
  },
  {
    name: "Strength & Power",
    format: "4 rounds · ~35 min",
    items: ["5 clean & press / side", "8 reverse lunges / side", "6 single-leg deadlifts / side", "8 thrusters", "5 snatches / side"],
  },
];

export default function LandingPage() {
  const primaries = EXERCISES.filter(isPrimary);
  const structured = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": abs("/#website"),
        url: abs("/"),
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        inLanguage: "en",
      },
      {
        "@type": "WebApplication",
        "@id": abs("/#app"),
        name: SITE_NAME,
        url: abs("/app"),
        description: `${SITE_TAGLINE}. ${SITE_DESCRIPTION}`,
        applicationCategory: "HealthApplication",
        applicationSubCategory: "Workout planner",
        operatingSystem: "Any (web browser)",
        browserRequirements: "Requires JavaScript",
        isAccessibleForFree: true,
        offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
        featureList: FEATURES.map((f) => f.title),
      },
      {
        "@type": "FAQPage",
        "@id": abs("/#faq"),
        mainEntity: FAQ.map(({ q, a }) => ({
          "@type": "Question",
          name: q,
          acceptedAnswer: { "@type": "Answer", text: a },
        })),
      },
      {
        "@type": "ItemList",
        "@id": abs("/#exercises"),
        name: "Kettlebell exercises",
        numberOfItems: EXERCISES.length,
        itemListElement: EXERCISES.map((e, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: e.name,
          url: abs(`/exercises/${exerciseSlug(e)}`),
        })),
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(structured)} />
      <SiteHeader />
      <main className="flex-1">
        {/* ---------------- Hero ---------------- */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-40 right-[-10%] h-[520px] w-[520px] rounded-full bg-accent/15 blur-3xl"
          />
          <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-12 sm:pt-20 lg:grid-cols-[1.05fr_1fr]">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs text-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-rest" /> Free · No sign-up · Runs in your browser
              </p>
              <h1 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
                Kettlebell workout planner <span className="text-accent">&amp; timer</span>
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink/80">
                Build kettlebell workouts from {EXERCISES.length} exercises with animated front and side demos. Train in
                fixed rounds or as an AMRAP against the clock – the voice coach takes you through every set, side and
                break.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/app"
                  className="rounded-2xl bg-accent hover:bg-accent-strong px-6 py-3.5 font-semibold text-black transition-colors"
                >
                  Start training – it&apos;s free
                </Link>
                <Link
                  href="/exercises"
                  className="rounded-2xl border border-line bg-surface hover:border-accent/60 px-6 py-3.5 font-semibold transition-colors"
                >
                  Browse {EXERCISES.length} exercises
                </Link>
              </div>
              <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 text-sm">
                {[
                  [String(EXERCISES.length), "animated exercises"],
                  ["2", "workout formats"],
                  ["3", "grip variants"],
                ].map(([v, k]) => (
                  <div key={k} className="border-l-2 border-accent/60 pl-3">
                    <dt className="sr-only">{k}</dt>
                    <dd className="font-mono text-2xl font-semibold">{v}</dd>
                    <dd className="text-muted">{k}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <HeroDemo />
          </div>
        </section>

        {/* ---------------- What is it ---------------- */}
        <section aria-labelledby="what" className="mx-auto max-w-3xl px-4 py-12 text-center">
          <h2 id="what" className="text-2xl font-bold sm:text-3xl">
            What is {SITE_NAME}?
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-ink/80">
            {SITE_NAME} is a free web app for planning and running kettlebell workouts. You pick exercises from an
            animated library, set reps or time, weight and rest, and the built-in interval timer guides you through each
            set with voice cues, countdown beeps and a live demo of the movement.
          </p>
        </section>

        {/* ---------------- Features ---------------- */}
        <section aria-labelledby="features" className="mx-auto max-w-6xl px-4 py-12">
          <h2 id="features" className="sr-only">
            Features
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <li key={f.title} className="rounded-3xl border border-line bg-surface p-6">
                <span className="font-mono text-xs text-accent-strong">0{i + 1}</span>
                <h3 className="mt-2 text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{f.text}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* ---------------- Formats / AMRAP ---------------- */}
        <section id="amrap" aria-labelledby="formats" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16">
          <h2 id="formats" className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
            Rounds or AMRAP: two ways to structure a kettlebell workout
          </h2>
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <article className="rounded-3xl border border-line bg-surface p-6 sm:p-8">
              <h3 className="text-xl font-semibold">What is a rounds-based kettlebell workout?</h3>
              <p className="mt-3 leading-relaxed text-ink/80">
                You repeat a list of exercises for a set number of rounds – for example 3 rounds of 5 exercises. After
                every exercise there is a short rest, and between rounds a longer break. It is the best format for
                learning technique and for strength work with heavier bells.
              </p>
              <ol className="mt-6 space-y-2 font-mono text-sm">
                <li className="flex justify-between rounded-xl bg-surface-2 px-4 py-2.5">
                  <span>Deadlift × 10</span>
                  <span className="text-rest">rest 20 s</span>
                </li>
                <li className="flex justify-between rounded-xl bg-surface-2 px-4 py-2.5">
                  <span>Goblet squat × 10</span>
                  <span className="text-rest">rest 20 s</span>
                </li>
                <li className="flex justify-between rounded-xl bg-surface-2 px-4 py-2.5">
                  <span>Swing × 30 s</span>
                  <span className="text-rest">round break 60 s</span>
                </li>
                <li className="px-4 text-muted">… repeat for 3 rounds</li>
              </ol>
            </article>
            <article className="rounded-3xl border border-accent/40 bg-surface p-6 sm:p-8">
              <h3 className="text-xl font-semibold">What is a kettlebell AMRAP?</h3>
              <p className="mt-3 leading-relaxed text-ink/80">
                AMRAP stands for <strong>&ldquo;as many rounds as possible&rdquo;</strong>. You choose a fixed sequence
                of exercises – say five – and a time cap such as 20 minutes. You go straight from one exercise into the
                next without resting and only take a short break when the circuit starts over. Your score is the number
                of rounds (plus extra exercises) finished before time runs out.
              </p>
              <ol className="mt-6 space-y-2 font-mono text-sm">
                {["Swing × 15", "Goblet squat × 10", "Two-hand row × 10", "Push press × 5 / side", "Farmer's carry 30 s"].map(
                  (x) => (
                    <li key={x} className="rounded-xl bg-surface-2 px-4 py-2.5">
                      {x}
                    </li>
                  ),
                )}
                <li className="flex justify-between px-4 text-muted">
                  <span>↻ 30 s break, then start over</span>
                  <span className="text-accent-strong">until 20:00</span>
                </li>
              </ol>
              <p className="mt-4 text-sm text-muted">
                {SITE_NAME} counts the clock, rounds and extra exercises for you and saves your personal best.
              </p>
            </article>
          </div>
        </section>

        {/* ---------------- Grip variants ---------------- */}
        <section aria-labelledby="grips" className="mx-auto max-w-6xl px-4 py-16">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.1fr]">
            <div>
              <h2 id="grips" className="text-3xl font-bold tracking-tight sm:text-4xl">
                One arm, two hands or two kettlebells?
              </h2>
              <p className="mt-4 leading-relaxed text-ink/80">
                Many kettlebell exercises can be loaded in different ways. A <strong>one-arm</strong> row trains each
                side separately and makes your core fight rotation. The <strong>two-hand</strong> version holds one bell
                with both hands – easier to balance and great for beginners. A <strong>double-kettlebell</strong> row
                uses a bell in each hand for the heaviest load. In the planner you switch the grip with one tap.
              </p>
              <ul className="mt-6 flex flex-wrap gap-2 text-sm">
                {["row", "press", "clean", "front-squat-double", "bicep-curl", "deadlift", "farmers-carry", "swing"].map((id) => {
                  const ex = getExercise(id);
                  return (
                    <li key={id}>
                      <Link
                        href={href(id)}
                        className="block rounded-full border border-line px-3.5 py-1.5 text-muted hover:border-accent/60 hover:text-ink"
                      >
                        {ex.name.replace(/^(Single-Arm|Double|Two-Hand) /, "")} ·{" "}
                        <span className="text-ink">{getVariants(ex).length} grips</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {getVariants(getExercise("row")).map((v) => (
                <Link
                  key={v.id}
                  href={href(v.id)}
                  className="group rounded-2xl border border-line bg-surface p-1.5 hover:border-accent/60"
                >
                  <ExerciseDemo id={v.id} views={["side"]} minimal className="aspect-[4/5] w-full" />
                  <div className="px-1.5 pb-1 pt-1.5 text-center text-xs font-semibold">{v.variant!.label}</div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- Library ---------------- */}
        <section aria-labelledby="library" className="mx-auto max-w-6xl px-4 py-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 id="library" className="text-3xl font-bold tracking-tight sm:text-4xl">
                Kettlebell exercise library
              </h2>
              <p className="mt-3 max-w-2xl text-ink/80">
                {primaries.length} movements and {EXERCISES.length} variations – each with step-by-step technique cues,
                muscles worked and the most common mistakes.
              </p>
            </div>
            <Link href="/exercises" className="font-semibold text-accent-strong hover:underline">
              Open the exercise guide →
            </Link>
          </div>
          <div className="mt-10 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((c) => (
              <div key={c}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">{c}</h3>
                <ul className="mt-3 space-y-1.5">
                  {EXERCISES.filter((e) => e.category === c).map((e) => (
                    <li key={e.id}>
                      <Link href={`/exercises/${exerciseSlug(e)}`} className="hover:text-accent-strong">
                        {e.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ---------------- How it works ---------------- */}
        <section aria-labelledby="how" className="mx-auto max-w-6xl px-4 py-16">
          <h2 id="how" className="text-3xl font-bold tracking-tight sm:text-4xl">
            How to build a kettlebell workout in 3 steps
          </h2>
          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              ["Pick your exercises", "Add moves from the library and choose one-arm, two-hand or double-kettlebell for each."],
              ["Set the format", "Fixed rounds with rest, or an AMRAP with a time cap and a short break between circuits."],
              ["Press start", "Follow the animated demo and voice cues. Your completed workouts and AMRAP bests are saved."],
            ].map(([t, d], i) => (
              <li key={t} className="rounded-3xl border border-line bg-surface p-6">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent font-bold text-black">
                  {i + 1}
                </span>
                <h3 className="mt-4 text-lg font-semibold">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{d}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ---------------- Ready-made workouts ---------------- */}
        <section id="workouts" aria-labelledby="ready" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16">
          <h2 id="ready" className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready-made kettlebell workouts
          </h2>
          <p className="mt-3 max-w-2xl text-ink/80">
            The app comes with these plans so you can start right away – edit them or build your own.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {WORKOUTS.map((w) => (
              <article key={w.name} className="flex flex-col rounded-3xl border border-line bg-surface p-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-accent-strong">{w.format}</p>
                <h3 className="mt-2 text-lg font-semibold">{w.name}</h3>
                <ul className="mt-4 flex-1 space-y-1.5 text-sm text-muted">
                  {w.items.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
                <Link href="/app" className="mt-6 text-sm font-semibold text-accent-strong hover:underline">
                  Start this workout →
                </Link>
              </article>
            ))}
          </div>
        </section>

        {/* ---------------- FAQ ---------------- */}
        <section id="faq" aria-labelledby="faq-title" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-16">
          <h2 id="faq-title" className="text-3xl font-bold tracking-tight sm:text-4xl">
            Kettlebell training FAQ
          </h2>
          <div className="mt-8 divide-y divide-line border-y border-line">
            {FAQ.map(({ q, a }, i) => (
              <details key={q} className="group py-5" open={i === 0}>
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-lg font-semibold">
                  <h3>{q}</h3>
                  <span className="mt-1 text-accent transition-transform group-open:rotate-45" aria-hidden>
                    +
                  </span>
                </summary>
                <p className="mt-3 leading-relaxed text-ink/80">{a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ---------------- CTA ---------------- */}
        <section className="mx-auto max-w-6xl px-4">
          <div className="relative overflow-hidden rounded-[2rem] bg-accent px-6 py-12 text-center text-black sm:px-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Grab your kettlebell.</h2>
            <p className="mx-auto mt-3 max-w-xl text-black/75">
              Build your first plan in a minute – no account, no download, no cost.
            </p>
            <Link
              href="/app"
              className="mt-8 inline-block rounded-2xl bg-black px-7 py-3.5 font-semibold text-ink hover:bg-black/85"
            >
              Open the workout planner
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
