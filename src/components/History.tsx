"use client";

import { useEffect, useState } from "react";
import { deleteSession, formatSessionSummary, groupByDay, useHistory, type WorkoutSession } from "@/lib/history";
import { Icon } from "./ui";

function SessionRow({ s }: { s: WorkoutSession }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  return (
    <div className="animate-fade-up min-w-0 rounded-2xl bg-surface border border-line p-3 sm:p-4 flex items-start gap-3">
      <div className="flex-1 min-w-0">
        <div className="font-semibold truncate">{s.planName}</div>
        <div className="mt-0.5 text-xs text-muted flex flex-wrap gap-x-2 gap-y-1 items-center">
          <span>{new Date(s.endedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
          {s.format === "amrap" ? (
            <span className="rounded-full bg-accent/15 text-accent-strong px-2 text-xs font-semibold leading-5">AMRAP</span>
          ) : (
            <span className="rounded-full bg-surface-2 px-2 text-xs font-semibold leading-5">Rounds</span>
          )}
          {s.status === "aborted" && <span className="text-danger font-semibold">Stopped early</span>}
          {s.edited && <span>edited</span>}
        </div>
        <div className="mt-1 text-sm font-mono break-words">{formatSessionSummary(s)}</div>
      </div>
      {confirmDelete ? (
        <button
          onClick={() => deleteSession(s.id)}
          onBlur={() => setConfirmDelete(false)}
          autoFocus
          className="shrink-0 px-3 py-2.5 rounded-xl bg-danger text-black text-sm font-semibold whitespace-nowrap"
        >
          Delete?
        </button>
      ) : (
        <button
          onClick={() => setConfirmDelete(true)}
          className="shrink-0 p-2.5 rounded-xl bg-surface-2 text-muted hover:text-danger flex justify-center"
          aria-label="Delete entry"
          title="Delete"
        >
          <Icon.Trash />
        </button>
      )}
    </div>
  );
}

export function HistoryView() {
  const sessions = useHistory();
  // "now" decides Today/Yesterday – refresh it when the app comes back to the foreground and at midnight.
  // The list only renders after hydration (useHistory is null until then), so there is no SSR mismatch.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const refresh = () => setNow(Date.now());
    const onVisible = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", refresh);
    const next = new Date();
    next.setHours(24, 0, 1, 0);
    const timer = window.setTimeout(refresh, next.getTime() - Date.now());
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", refresh);
      window.clearTimeout(timer);
    };
  }, [now]);

  if (sessions === null) {
    return (
      <div className="grid grid-cols-1 gap-4 max-w-2xl">
        {[0, 1].map((i) => (
          <div key={i} className="h-20 rounded-2xl bg-surface border border-line animate-pulse" />
        ))}
      </div>
    );
  }
  if (sessions.length === 0) {
    return (
      <div className="rounded-3xl border-2 border-dashed border-line p-10 text-center">
        <p className="text-muted">No workouts logged yet. Finish a workout and it shows up here.</p>
      </div>
    );
  }

  const done = sessions.filter((s) => s.status !== "aborted");
  const week = done.filter((s) => now - s.endedAt <= 7 * 24 * 3600 * 1000).length;
  const groups = groupByDay(sessions, now);

  return (
    <div className="max-w-2xl min-w-0">
      <div className="grid grid-cols-2 gap-3">
        {(
          [
            ["Last 7 days", week],
            ["Total", done.length],
          ] as const
        ).map(([k, v]) => (
          <div key={k} className="rounded-2xl bg-surface border border-line p-4">
            <div className="font-mono text-2xl font-semibold">{v}</div>
            <div className="text-xs text-muted mt-1">{k}</div>
          </div>
        ))}
      </div>
      {groups.map((g) => (
        <section key={g.day} className="mt-6">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">{g.label}</h2>
          <div className="flex flex-col gap-2">
            {g.items.map((s) => (
              <SessionRow key={s.id} s={s} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
