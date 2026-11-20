import { EXERCISES } from "./exercises";

/** Public origin of the site, used for canonical URLs, the sitemap and structured data. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://bellwork.sfalter.de").replace(/\/$/, "");
export const SITE_NAME = "Bellwork";
export const SITE_TAGLINE = "Free kettlebell workout planner & timer";
export const SITE_DESCRIPTION = `Free kettlebell workout planner and interval timer with ${EXERCISES.length} animated exercise demos. Build fixed-round or AMRAP circuits, choose one-arm, two-hand or double-kettlebell variants, and train with voice cues – no sign-up.`;

export const abs = (path: string) => `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;

/** Questions people (and answer engines) ask – rendered on the landing page and as FAQPage JSON-LD. */
export const FAQ: { q: string; a: string }[] = [
  {
    q: "Is Bellwork free?",
    a: "Yes. Bellwork is completely free and needs no account. Your workout plans and results are saved locally in your browser, so nothing is uploaded and you can start training right away.",
  },
  {
    q: "What is a kettlebell AMRAP workout?",
    a: "AMRAP means \"as many rounds as possible\". You pick a fixed sequence of exercises – for example five – and a time cap such as 20 minutes. You move from one exercise straight into the next without resting, take only a short break each time the circuit starts over, and count how many rounds you finish before time runs out.",
  },
  {
    q: "What weight kettlebell should a beginner start with?",
    a: "As a rough guide, many women start with 8–12 kg and many men with 12–16 kg for swings, deadlifts and squats, and go lighter for overhead presses. Pick a weight you can control for every rep with good form; you can set a different weight for each exercise in your plan.",
  },
  {
    q: "Can you get a full-body workout with one kettlebell?",
    a: "Yes. A single kettlebell covers every major movement pattern: hinge (swing, deadlift), squat (goblet squat), push (press), pull (bent-over row), lunge and carry. Combine one exercise from each pattern into rounds or an AMRAP circuit for a complete full-body session.",
  },
  {
    q: "What is the difference between one-arm, two-hand and double kettlebell exercises?",
    a: "One-arm exercises load one side, so your core has to resist rotation and you train each side separately. Two-hand versions hold one bell with both hands, which is easier to balance and lets beginners lift more. Double-kettlebell versions use a bell in each hand for the heaviest total load. Many exercises in Bellwork can be switched between these grips.",
  },
  {
    q: "How long should a kettlebell workout be?",
    a: "Most effective kettlebell workouts take 15 to 30 minutes. Short, intense formats like a 15- or 20-minute AMRAP work well for conditioning, while strength-focused sessions with heavier bells and longer rests can take 30 to 45 minutes.",
  },
  {
    q: "How often should I do kettlebell workouts?",
    a: "Two to four sessions per week is a good target for most people. Leave at least one rest day between hard sessions that use the same muscles, and increase reps, rounds or weight gradually.",
  },
  {
    q: "Which kettlebell exercises should beginners learn first?",
    a: "Start with the deadlift, goblet squat, two-hand swing, bent-over row and overhead press. They teach the hip hinge, squat, pull and press that almost every other kettlebell exercise builds on. Each one has an animated front and side view in the exercise guide.",
  },
  {
    q: "Does the app work on my phone?",
    a: "Yes. Bellwork runs in any modern mobile or desktop browser. During a workout it keeps the screen awake, counts down every timed set with beeps and announces the next exercise by voice.",
  },
];

export function jsonLd(data: unknown) {
  return { __html: JSON.stringify(data).replace(/</g, "\\u003c") };
}
