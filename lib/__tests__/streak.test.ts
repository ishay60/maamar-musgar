import { describe, expect, it } from "vitest";
import { applyCompletion, deriveStreak, emptyStreak, mergeStreak } from "../streak";

const done = (d: string, current: number, last: string | null = d) => ({
  ...emptyStreak,
  current,
  longest: current,
  lastPuzzleDate: last,
  completed: { [d]: { score: 100, rank: "x" } },
});

describe("applyCompletion", () => {
  it("starts a streak on first daily completion", () => {
    const s = applyCompletion(emptyStreak, "2026-05-01", "2026-05-01", 90, "r");
    expect(s.current).toBe(1);
    expect(s.longest).toBe(1);
    expect(s.lastPuzzleDate).toBe("2026-05-01");
  });

  it("extends the streak on consecutive days", () => {
    const s = applyCompletion(done("2026-05-01", 3), "2026-05-02", "2026-05-02", 90, "r");
    expect(s.current).toBe(4);
    expect(s.longest).toBe(4);
  });

  it("resets after a gap", () => {
    const s = applyCompletion(done("2026-05-01", 3), "2026-05-04", "2026-05-04", 90, "r");
    expect(s.current).toBe(1);
    expect(s.longest).toBe(3);
  });

  it("does not touch the streak for archive puzzles", () => {
    const s = applyCompletion(done("2026-05-02", 3), "2026-04-10", "2026-05-02", 90, "r");
    expect(s.current).toBe(3);
    expect(s.lastPuzzleDate).toBe("2026-05-02");
    expect(s.completed["2026-04-10"]).toEqual({ score: 90, rank: "r" });
  });

  it("ignores replays of an already completed puzzle", () => {
    const prev = done("2026-05-01", 3);
    expect(applyCompletion(prev, "2026-05-01", "2026-05-01", 50, "r")).toBe(prev);
  });
});

describe("deriveStreak", () => {
  it("counts the run ending today or yesterday", () => {
    const s = deriveStreak(["2026-05-01", "2026-05-02", "2026-05-04", "2026-05-05"], "2026-05-06");
    expect(s).toEqual({ current: 2, longest: 2, lastPuzzleDate: "2026-05-05" });
  });
  it("is zero after a gap, longest kept", () => {
    const s = deriveStreak(["2026-05-01", "2026-05-02", "2026-05-03"], "2026-05-10");
    expect(s).toEqual({ current: 0, longest: 3, lastPuzzleDate: "2026-05-03" });
  });
  it("handles no history", () => {
    expect(deriveStreak([], "2026-05-10")).toEqual({ current: 0, longest: 0, lastPuzzleDate: null });
  });
});

describe("mergeStreak", () => {
  const done = (...dates: string[]) => Object.fromEntries(dates.map((d) => [d, { score: 90, rank: "ראש עיר" }]));

  it("never lowers the local streak when the server has less", () => {
    const local = { current: 6, longest: 6, lastPuzzleDate: "2026-09-23", completed: done("2026-09-18", "2026-09-23") };
    const merged = mergeStreak(local, emptyStreak, "2026-09-24");
    expect(merged.current).toBe(6);
    expect(merged.longest).toBe(6);
    expect(Object.keys(merged.completed)).toHaveLength(2);
  });

  it("rebuilds a streak that an earlier sign-in overwrote with zeros", () => {
    const dates = ["2026-09-15", "2026-09-18", "2026-09-19", "2026-09-20", "2026-09-21", "2026-09-22", "2026-09-23"];
    const wiped = { current: 0, longest: 0, lastPuzzleDate: null, completed: done(...dates) };
    const merged = mergeStreak(wiped, emptyStreak, "2026-09-24");
    expect(merged.current).toBe(6);
    expect(merged.longest).toBe(6);
    expect(merged.lastPuzzleDate).toBe("2026-09-23");
  });

  it("takes the current streak from whichever side played last", () => {
    // Local run 09-17..09-18, then a gap: the server's run 09-21..09-24 is the current one.
    const local = { current: 2, longest: 9, lastPuzzleDate: "2026-09-18", completed: {} };
    const server = { current: 4, longest: 4, lastPuzzleDate: "2026-09-24", completed: done("2026-09-24") };
    const merged = mergeStreak(local, server, "2026-09-24");
    expect(merged).toMatchObject({ current: 4, longest: 9, lastPuzzleDate: "2026-09-24" });
  });

  it("joins runs that continue each other across devices", () => {
    const local = { current: 2, longest: 2, lastPuzzleDate: "2026-09-20", completed: {} };
    const server = { current: 4, longest: 4, lastPuzzleDate: "2026-09-24", completed: {} };
    expect(mergeStreak(local, server, "2026-09-24")).toMatchObject({ current: 6, longest: 6 });
  });
});
