import type { Metadata } from "next";
import { App } from "@/components/App";

export const metadata: Metadata = {
  title: "Workout Planner & Timer",
  description:
    "Build your kettlebell workout plan, pick one-arm, two-hand or double-kettlebell variants, and run it with a voice-guided interval timer – fixed rounds or AMRAP.",
  alternates: { canonical: "/app" },
};

export default function AppPage() {
  return <App />;
}
