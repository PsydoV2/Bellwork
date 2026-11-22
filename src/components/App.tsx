"use client";

import { useState } from "react";
import { getExercise } from "@/lib/exercises";
import Link from "next/link";
import {
  deletePlan,
  duplicatePlan,
  estimateSeconds,
  formatDuration,
  formatResult,
  isAmrap,
  newPlan,
  usePlans,
  type WorkoutPlan,
} from "@/lib/store";
import { bestResultFor, completionStatsFor, useHistory } from "@/lib/history";
import { unlockAudio } from "@/lib/audio";
import { SITE_NAME } from "@/lib/site";
import { ExerciseAnimation } from "./ExerciseAnimation";
import { ExerciseLibrary } from "./ExerciseLibrary";
import { HistoryView } from "./History";
import { PlanEditor } from "./PlanEditor";
import { ImportShared, SharePlanButton, useShareLink } from "./Sharing";
import { WorkoutPlayer } from "./WorkoutPlayer";
import { Icon } from "./ui";

type View =
  | { name: "home"; tab: "plans" | "library" | "history" }
  | { name: "edit"; plan: WorkoutPlan }
  | { name: "play"; plan: WorkoutPlan };

function KettlebellLogo() {
  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden>
      <path d="M10 14 Q9 5 16 5 Q23 5 22 14" fill="none" stroke="var(--color-bell-dark)" strokeWidth="3.5" />
      <circle cx="16" cy="20" r="9" fill="var(--color-bell)" />
      <circle cx="13" cy="17" r="2.5" fill="var(--color-bell-shine)" />
    </svg>
  );
}

function PlanCard({
  plan,
  best,
  done,
  onStart,
  onEdit,
}: {
  plan: WorkoutPlan;
  best?: { rounds: number; extra: number };
  done: { count: number; last?: number };
  onStart: () => void;
  onEdit: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const exercises = plan.items.map((i) => getExercise(i.exerciseId));
  return (
    <div className="animate-fade-up min-w-0 rounded-3xl bg-surface border border-line p-4 sm:p-5 flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold leading-tight">{plan.name}</h3>
          <div className="mt-1 text-sm text-muted flex flex-wrap gap-x-3 gap-y-1">
            <span>{plan.items.length} exercises</span>
            {isAmrap(plan) ? (
              <span className="rounded-full bg-accent/15 text-accent-strong px-2 text-xs font-semibold leading-5">AMRAP</span>
            ) : (
              <span>{plan.rounds} rounds</span>
            )}
            <span className="flex items-center gap-1">
              <Icon.Clock width={14} height={14} /> {isAmrap(plan) ? "" : "~"}
              {formatDuration(estimateSeconds(plan) - (isAmrap(plan) ? 10 : 0))} min
            </span>
          </div>
          {done.count ? (
            <div className="mt-1 text-xs text-rest">
              {done.count}× completed
              {done.last && ` · last ${new Date(done.last).toLocaleDateString("en-GB")}`}
              {best && ` · best ${formatResult(best)}`}
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1">
        {exercises.map((ex, i) => (
          <div key={plan.items[i].id} className="shrink-0 w-[72px]" title={ex.name}>
            <div className="h-[72px] w-[72px] rounded-xl bg-surface-2 overflow-hidden">
              <ExerciseAnimation exercise={ex} playing={false} minimal views={["side"]} className="w-full h-full" />
            </div>
            <div className="mt-1 text-[11px] text-muted leading-tight line-clamp-2">{ex.name}</div>
          </div>
        ))}
      </div>

      {/* phone: full-width Start, then a row of equal icon buttons; sm+: everything in one row */}
      <div className="grid grid-cols-4 gap-2 sm:flex sm:items-center">
        <button
          onClick={onStart}
          className="col-span-4 sm:flex-1 rounded-xl bg-accent hover:bg-accent-strong text-black py-3 font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          <Icon.Play width={18} height={18} /> Start workout
        </button>
        <button
          onClick={onEdit}
          className="p-3 rounded-xl bg-surface-2 text-muted hover:text-ink flex justify-center"
          aria-label="Edit"
          title="Edit"
        >
          <Icon.Edit />
        </button>
        <SharePlanButton plan={plan} />
        <button
          onClick={() => duplicatePlan(plan.id)}
          className="p-3 rounded-xl bg-surface-2 text-muted hover:text-ink flex justify-center"
          aria-label="Duplicate"
          title="Duplicate"
        >
          <Icon.Copy />
        </button>
        {confirmDelete ? (
          <button
            onClick={() => deletePlan(plan.id)}
            onBlur={() => setConfirmDelete(false)}
            autoFocus
            className="px-3 py-3 rounded-xl bg-danger text-black text-sm font-semibold whitespace-nowrap"
          >
            Delete?
          </button>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-3 rounded-xl bg-surface-2 text-muted hover:text-danger flex justify-center"
            aria-label="Delete"
            title="Delete"
          >
            <Icon.Trash />
          </button>
        )}
      </div>
    </div>
  );
}

export function App() {
  const plans = usePlans();
  const history = useHistory();
  const [view, setView] = useState<View>({ name: "home", tab: "plans" });
  const [pasteOpen, setPasteOpen] = useState(false);
  const shareAll = useShareLink();
  const importer = <ImportShared pasteOpen={pasteOpen} onClosePaste={() => setPasteOpen(false)} />;

  if (view.name === "edit") {
    return <PlanEditor initial={view.plan} onDone={() => setView({ name: "home", tab: "plans" })} />;
  }
  if (view.name === "play") {
    return <WorkoutPlayer plan={view.plan} onExit={() => setView({ name: "home", tab: "plans" })} />;
  }

  const tab = view.tab;
  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-16">
      <header className="flex items-center gap-3 pt-6 pb-6 sm:pt-10">
        <Link href="/" className="flex flex-1 items-center gap-3 standalone:pointer-events-none" aria-label={`${SITE_NAME} home`}>
          <KettlebellLogo />
          <div>
            <div className="text-xl font-bold tracking-tight">{SITE_NAME}</div>
            <div className="text-xs text-muted">Plan. Swing. Repeat.</div>
          </div>
        </Link>
        <Link href="/exercises" className="text-sm text-muted hover:text-ink standalone:hidden">
          Exercise guide
        </Link>
      </header>

      <div className="flex items-center justify-between gap-2 sm:gap-3 mb-6">
        <div className="inline-flex min-w-0 overflow-x-auto rounded-full bg-surface border border-line p-1">
          {(
            [
              ["plans", "My plans"],
              ["library", "Exercises"],
              ["history", "History"],
            ] as const
          ).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setView({ name: "home", tab: t })}
              className={`whitespace-nowrap rounded-full px-2.5 sm:px-4 py-2 text-sm font-medium transition-colors ${
                tab === t ? "bg-ink text-bg" : "text-muted hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {tab === "plans" && (
          <button
            onClick={() => setView({ name: "edit", plan: newPlan() })}
            className="shrink-0 whitespace-nowrap rounded-full bg-accent hover:bg-accent-strong text-black p-2 sm:pl-3 sm:pr-4 sm:py-2 text-sm font-semibold flex items-center gap-1.5"
            aria-label="New plan"
          >
            <Icon.Plus width={18} height={18} /> <span className="hidden sm:inline">New plan</span>
          </button>
        )}
      </div>

      {tab === "library" ? (
        <ExerciseLibrary />
      ) : tab === "history" ? (
        <HistoryView />
      ) : plans === null ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-64 rounded-3xl bg-surface border border-line animate-pulse" />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-line p-10 text-center">
          <p className="text-muted">No plans yet.</p>
          <button
            onClick={() => setView({ name: "edit", plan: newPlan() })}
            className="mt-4 rounded-xl bg-accent text-black px-5 py-3 font-semibold"
          >
            Create your first plan
          </button>
          <button onClick={() => setPasteOpen(true)} className="mt-3 block mx-auto text-sm text-muted hover:text-ink">
            …or import from a link
          </button>
        </div>
      ) : (
        <>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {plans.map((p) => (
            <PlanCard
              key={p.id}
              plan={p}
              best={history ? bestResultFor(p, history) : p.bestResult}
              done={completionStatsFor(p, history ?? [])}
              onEdit={() => setView({ name: "edit", plan: p })}
              onStart={() => {
                unlockAudio();
                setView({ name: "play", plan: p });
              }}
            />
          ))}
        </div>
        <div className="mt-8 rounded-3xl border border-line p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 text-sm">
            <div className="font-semibold">Use your plans on another device</div>
            <div className="text-muted">
              No account needed – your workouts travel inside the link. Open it on the other device to import.
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => shareAll.share(plans, `My ${SITE_NAME} workouts`)}
              className="flex-1 sm:flex-none rounded-xl bg-surface-2 px-4 py-2.5 text-sm font-semibold flex items-center justify-center gap-2 hover:text-ink"
            >
              <Icon.Share width={16} height={16} /> Share all
            </button>
            <button
              onClick={() => setPasteOpen(true)}
              className="flex-1 sm:flex-none rounded-xl bg-surface-2 px-4 py-2.5 text-sm font-semibold flex items-center justify-center gap-2 hover:text-ink"
            >
              <Icon.Import width={16} height={16} /> Paste link
            </button>
          </div>
        </div>
        </>
      )}
      {shareAll.dialog}
      {importer}
    </div>
  );
}
