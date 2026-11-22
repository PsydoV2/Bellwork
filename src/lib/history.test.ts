import { beforeEach, describe, expect, it, vi } from "vitest";
import type { WorkoutSession } from "./history";
import type { WorkoutPlan } from "./store";

const KEY = "kb-workout-history-v1";
const session = (o: Partial<WorkoutSession> = {}): WorkoutSession => ({
  id: "s1",
  planId: "p",
  planName: "Plan",
  format: "amrap",
  startedAt: 0,
  endedAt: 1000,
  duration: 1200,
  status: "timeUp",
  sets: 31,
  rounds: 5,
  timeCap: 1200,
  result: { rounds: 5, extra: 2 },
  ...o,
});
const plan = (o: Partial<WorkoutPlan> = {}): WorkoutPlan => ({
  id: "p",
  name: "P",
  rounds: 1,
  roundRest: 0,
  items: [],
  createdAt: 1,
  ...o,
});

async function load() {
  vi.resetModules();
  return import("./history");
}

beforeEach(() => localStorage.clear());

describe("history store", () => {
  it("adds sessions idempotently per id", async () => {
    const h = await load();
    h.addSession(session());
    h.addSession(session({ sets: 40 }));
    expect(h.getHistory()).toHaveLength(1);
    expect(h.getHistory()[0].sets).toBe(40);
    expect(JSON.parse(localStorage.getItem(KEY)!)).toHaveLength(1);
  });

  it("updateSessionResult sets result, rounds and edited", async () => {
    const h = await load();
    h.addSession(session());
    h.updateSessionResult("s1", { rounds: 4, extra: 1 });
    expect(h.getHistory()[0]).toMatchObject({ result: { rounds: 4, extra: 1 }, rounds: 4, edited: true });
  });

  it("deletes sessions", async () => {
    const h = await load();
    h.addSession(session());
    h.deleteSession("s1");
    expect(h.getHistory()).toEqual([]);
  });

  it("returns [] for broken JSON and filters invalid entries", async () => {
    localStorage.setItem(KEY, "{nope");
    expect((await load()).getHistory()).toEqual([]);
    localStorage.setItem(KEY, JSON.stringify([session(), { id: 1 }, null, session({ id: "s2", format: "x" as never })]));
    expect((await load()).getHistory().map((s) => s.id)).toEqual(["s1"]);
  });

  it("rejects entries with broken required fields", async () => {
    const bad = [
      session({ id: "a", planName: undefined as never }),
      session({ id: "b", sets: undefined as never }),
      session({ id: "c", rounds: NaN as never }),
      session({ id: "d", duration: "x" as never }),
      session({ id: "e", startedAt: undefined as never }),
      session({ id: "f", endedAt: Infinity }),
    ];
    localStorage.setItem(KEY, JSON.stringify([session(), ...bad]));
    expect((await load()).getHistory().map((s) => s.id)).toEqual(["s1"]);
  });

  it("drops invalid optional fields but keeps the entry; older entries without tracked stay valid", async () => {
    const broken = session({
      id: "x",
      roundsPlanned: "3" as never,
      timeCap: null as never,
      result: { rounds: "a", extra: 1 } as never,
      tracked: 5 as never,
      edited: "yes" as never,
    });
    localStorage.setItem(KEY, JSON.stringify([session({ id: "old" }), broken]));
    const all = (await load()).getHistory();
    expect(all.map((s) => s.id)).toEqual(["old", "x"]);
    const x = all[1];
    for (const k of ["roundsPlanned", "timeCap", "result", "tracked", "edited"]) expect(x).not.toHaveProperty(k);
    expect(all[0]).toEqual(session({ id: "old" }));
    const valid = session({ id: "v", roundsPlanned: 3, tracked: { rounds: 5, extra: 2 }, edited: false });
    localStorage.setItem(KEY, JSON.stringify([valid]));
    expect((await load()).getHistory()).toEqual([valid]);
  });

  it("caps at MAX_SESSIONS dropping the oldest", async () => {
    const h = await load();
    for (let i = 0; i < h.MAX_SESSIONS + 5; i++) h.addSession(session({ id: `s${i}` }));
    const all = h.getHistory();
    expect(all).toHaveLength(h.MAX_SESSIONS);
    expect(all[0].id).toBe("s5");
  });
});

describe("bestResultFor", () => {
  it("ignores aborted and excluded sessions, uses legacy best, prefers higher extra", async () => {
    const h = await load();
    const sessions = [
      session({ id: "a", result: { rounds: 9, extra: 0 }, status: "aborted" }),
      session({ id: "b", result: { rounds: 7, extra: 0 } }),
      session({ id: "c", result: { rounds: 6, extra: 1 } }),
      session({ id: "d", result: { rounds: 6, extra: 3 } }),
      session({ id: "e", planId: "other", result: { rounds: 50, extra: 0 } }),
    ];
    expect(h.bestResultFor(plan(), sessions)).toEqual({ rounds: 7, extra: 0 });
    expect(h.bestResultFor(plan(), sessions, "b")).toEqual({ rounds: 6, extra: 3 });
    expect(h.bestResultFor(plan({ bestResult: { rounds: 8, extra: 0, at: 1 } }), sessions)).toEqual({ rounds: 8, extra: 0 });
    expect(h.bestResultFor(plan(), [])).toBeUndefined();
  });
});

describe("formatSessionSummary", () => {
  it("formats AMRAP and rounds sessions", async () => {
    const h = await load();
    expect(h.formatSessionSummary(session())).toBe("5 rounds + 2 · 31 sets · 20:00");
    expect(
      h.formatSessionSummary(
        session({ format: "rounds", rounds: 3, roundsPlanned: 3, sets: 15, duration: 1122, result: undefined, timeCap: undefined }),
      ),
    ).toBe("3/3 rounds · 15 sets · 18:42");
  });
});

describe("groupByDay", () => {
  it("labels days and sorts descending", async () => {
    const h = await load();
    const now = new Date(2026, 5, 15, 12, 0).getTime();
    const at = (d: number, hr: number) => new Date(2026, 5, d, hr, 0).getTime();
    const groups = h.groupByDay(
      [
        session({ id: "old", endedAt: at(1, 9) }),
        session({ id: "y", endedAt: at(14, 18) }),
        session({ id: "t1", endedAt: at(15, 8) }),
        session({ id: "t2", endedAt: at(15, 10) }),
      ],
      now,
    );
    expect(groups.map((g) => g.label)).toEqual(["Today", "Yesterday", expect.stringContaining("2026")]);
    expect(groups[0].items.map((s) => s.id)).toEqual(["t2", "t1"]);
  });

  it("finds yesterday via calendar days (also across DST changes)", async () => {
    const h = await load();
    // vitest.config.mts pins TZ to Europe/Berlin: 2026-03-29 is 23h long, 2026-10-25 is 25h long.
    // A "now - 24h" shortcut fails at 00:30 after spring-forward and at 23:30 on the fall-back day.
    const cases: [Date, Date][] = [
      [new Date(2026, 2, 30, 0, 30), new Date(2026, 2, 29, 12, 0)],
      [new Date(2026, 9, 25, 23, 30), new Date(2026, 9, 24, 12, 0)],
      [new Date(2026, 9, 26, 0, 30), new Date(2026, 9, 25, 12, 0)],
    ];
    for (const [now, ended] of cases) {
      const groups = h.groupByDay([session({ id: "y", endedAt: ended.getTime() })], now.getTime());
      expect(groups[0].label).toBe("Yesterday");
    }
  });
});

describe("formatSessionSummary (aborted)", () => {
  it("shows the played time instead of the cap for an aborted AMRAP", async () => {
    const h = await load();
    expect(h.formatSessionSummary(session({ status: "aborted", duration: 305, timeCap: 1200 }))).toBe(
      "5 rounds + 2 · 31 sets · 5:05",
    );
  });
});

describe("completionStatsFor", () => {
  it("adds non-aborted sessions to the frozen legacy counters", async () => {
    const h = await load();
    const sessions = [
      session({ id: "a", endedAt: 5000 }),
      session({ id: "b", endedAt: 9000, status: "aborted" }),
      session({ id: "c", planId: "other", endedAt: 99999 }),
    ];
    expect(h.completionStatsFor(plan({ timesCompleted: 3, lastCompletedAt: 2000 }), sessions)).toEqual({ count: 4, last: 5000 });
    expect(h.completionStatsFor(plan({ timesCompleted: 3, lastCompletedAt: 7000 }), sessions)).toEqual({ count: 4, last: 7000 });
    expect(h.completionStatsFor(plan(), sessions)).toEqual({ count: 1, last: 5000 });
  });

  it("follows deletions and does not double count", async () => {
    const h = await load();
    const p = plan({ timesCompleted: 2, lastCompletedAt: 100 });
    h.addSession(session({ id: "a", endedAt: 500 }));
    h.addSession(session({ id: "a", endedAt: 500 }));
    expect(h.completionStatsFor(p, h.getHistory()).count).toBe(3);
    h.deleteSession("a");
    expect(h.completionStatsFor(p, h.getHistory())).toEqual({ count: 2, last: 100 });
  });
});

describe("edited flag", () => {
  it("is only set while the result differs from the tracked one", async () => {
    const h = await load();
    h.addSession(session({ tracked: { rounds: 5, extra: 2 } }));
    h.updateSessionResult("s1", { rounds: 6, extra: 0 });
    expect(h.getHistory()[0].edited).toBe(true);
    h.updateSessionResult("s1", { rounds: 5, extra: 2 });
    expect(h.getHistory()[0].edited).toBe(false);
  });

  it("treats entries without a tracked baseline as edited on change", async () => {
    const h = await load();
    h.addSession(session());
    h.updateSessionResult("s1", { rounds: 1, extra: 0 });
    expect(h.getHistory()[0].edited).toBe(true);
  });
});

describe("multiple tabs", () => {
  it("does not overwrite sessions written by another tab", async () => {
    const h = await load();
    h.addSession(session({ id: "a" }));
    // another tab adds a session directly to localStorage
    localStorage.setItem(KEY, JSON.stringify([...h.getHistory(), session({ id: "other" })]));
    h.addSession(session({ id: "b" }));
    expect(h.getHistory().map((s) => s.id)).toEqual(["a", "other", "b"]);
  });
});
