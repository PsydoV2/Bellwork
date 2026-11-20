import { CATEGORIES, EXERCISES, exerciseSlug, seoName } from "@/lib/exercises";
import { abs, FAQ, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

// prerendered to a static file at build time (required for `output: "export"`)
export const dynamic = "force-static";

/** llms.txt – a plain-text map of the site for AI answer engines (https://llmstxt.org). */
export function GET() {
  const lines = [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_DESCRIPTION}`,
    "",
    `${SITE_NAME} is a free browser app (no account) for planning and running kettlebell workouts.`,
    "Workouts can be fixed rounds (rest after every exercise, longer break between rounds) or AMRAP",
    "(as many rounds as possible: a fixed circuit repeated back-to-back until a time cap, with a short",
    "break only when the circuit starts over). Many exercises can be switched between one-arm, two-hand",
    "and double-kettlebell (two bells) versions.",
    "",
    "## Pages",
    `- [Home](${abs("/")}): overview, workout formats, FAQ`,
    `- [Workout planner & timer](${abs("/app")}): build and run workouts`,
    `- [Exercise guide](${abs("/exercises")}): all ${EXERCISES.length} exercises`,
    "",
    ...CATEGORIES.flatMap((c) => [
      `## ${c} exercises`,
      ...EXERCISES.filter((e) => e.category === c).map(
        (e) =>
          `- [${seoName(e)}](${abs(`/exercises/${exerciseSlug(e)}`)}): ${e.subtitle}. ${e.difficulty}; works ${e.muscles.join(", ").toLowerCase()}.`,
      ),
      "",
    ]),
    "## FAQ",
    ...FAQ.flatMap(({ q, a }) => [`### ${q}`, a, ""]),
  ];
  return new Response(lines.join("\n"), { headers: { "content-type": "text/plain; charset=utf-8" } });
}
