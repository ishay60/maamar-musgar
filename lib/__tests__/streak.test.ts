import { describe, expect, it } from "vitest";
import { applyCompletion, emptyStreak } from "../streak";

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
