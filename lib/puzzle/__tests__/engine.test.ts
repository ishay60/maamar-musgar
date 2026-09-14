import { describe, expect, it } from "vitest";
import { buildPuzzle } from "../build";
import {
  applyGuess,
  applyGuessToSolvableLeaf,
  applyPeek,
  applyReveal,
  createGameState,
  getSolvableLeaves,
  isNodeSolvable,
  isPuzzleComplete,
} from "../engine";
import { computeScore } from "../scoring";
import { normalizeHebrew } from "../hebrew";

const nested = () =>
  buildPuzzle({
    id: "nested",
    date: "2026-01-01",
    finalSentence: "ירושלים בירה",
    bracketString: "[[inner] capital] [tail]",
    specs: [
      { answer: "ירושלים" }, // outer (b0)
      { answer: "ישראל" }, // inner (b1)
      { answer: "בירה" }, // tail (b2)
    ],
  });

describe("game engine", () => {
  it("only inner nested bracket + siblings are initially solvable", () => {
    const p = nested();
    const st = createGameState(p);
    const leaves = getSolvableLeaves(p.tree, st.solved).map((n) => n.id);
    expect(leaves).toEqual(expect.arrayContaining(["b1", "b2"]));
    expect(leaves).not.toContain("b0");
  });

  it("locks parent until nested child is solved", () => {
    const p = nested();
    const st = createGameState(p);
    const res = applyGuess(p, st, "b0", "ירושלים");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe("locked");
  });

  it("unlocks parent via chain reaction on child solve", () => {
    const p = nested();
    const st = createGameState(p);
    const res = applyGuess(p, st, "b1", "ישראל");
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.newlySolvable.map((n) => n.id)).toContain("b0");
    }
  });

  it("solves any matching solvable leaf, even when another leaf is active", () => {
    const p = nested();
    const st = createGameState(p);
    st.activeNodeId = "b1";

    const res = applyGuessToSolvableLeaf(p, st, "בירה");

    expect(res.ok).toBe(true);
    if (res.ok) expect(res.solvedNodeId).toBe("b2");
    expect(st.solved.has("b2")).toBe(true);
    expect(st.solved.has("b1")).toBe(false);
    expect(st.activeNodeId).toBe("b1");
  });

  it("counts one wrong guess when no solvable leaf matches", () => {
    const p = nested();
    const st = createGameState(p);
    const res = applyGuessToSolvableLeaf(p, st, "wrong");

    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe("wrong");
    expect(st.wrongGuesses).toBe(1);
    expect(st.solved.size).toBe(0);
  });

  it("penalizes wrong guesses without marking solved", () => {
    const p = nested();
    const st = createGameState(p);
    const res = applyGuess(p, st, "b1", "wrong");
    expect(res.ok).toBe(false);
    expect(st.wrongGuesses).toBe(1);
    expect(st.solved.size).toBe(0);
  });

  it("accepts final-letter variants via normalization", () => {
    expect(normalizeHebrew("ירושלים")).toBe(normalizeHebrew("ירושלימ"));
    const p = buildPuzzle({
      id: "x",
      date: "2026-01-01",
      finalSentence: "ירושלים",
      bracketString: "[city]",
      specs: [{ answer: "ירושלים" }],
    });
    const st = createGameState(p);
    expect(applyGuess(p, st, "b0", "ירושלימ").ok).toBe(true);
  });

  it("accepts answers with nikud stripped", () => {
    expect(normalizeHebrew("דָּוִד")).toBe("דוד");
  });

  it("reveal solves the bracket and applies penalty", () => {
    const p = nested();
    const st = createGameState(p);
    applyReveal(p, st, "b1");
    expect(st.solved.has("b1")).toBe(true);
    expect(st.reveals.has("b1")).toBe(true);
    const score = computeScore(p, st);
    expect(score.revealPenalty).toBe(20);
  });

  it("peek flags the bracket but doesn't solve it", () => {
    const p = nested();
    const st = createGameState(p);
    expect(applyPeek(p, st, "b1")).toBe(true);
    expect(st.solved.has("b1")).toBe(false);
    expect(st.peeks.has("b1")).toBe(true);
  });

  it("reaches completion when all brackets solved", () => {
    const p = nested();
    const st = createGameState(p);
    applyGuess(p, st, "b1", "ישראל");
    applyGuess(p, st, "b2", "בירה");
    applyGuess(p, st, "b0", "ירושלים");
    expect(isPuzzleComplete(p.tree, st.solved)).toBe(true);
  });
});

describe("scoring", () => {
  it("awards kingmaker on a clean solve", () => {
    const p = nested();
    const st = createGameState(p);
    applyGuess(p, st, "b1", "ישראל");
    applyGuess(p, st, "b2", "בירה");
    applyGuess(p, st, "b0", "ירושלים");
    expect(computeScore(p, st).rank).toBe("kingmaker");
  });

  it("downgrades rank with wrong guesses and peeks", () => {
    const p = nested();
    const st = createGameState(p);
    applyGuess(p, st, "b1", "nope");
    applyGuess(p, st, "b1", "nope2");
    applyPeek(p, st, "b1");
    applyGuess(p, st, "b1", "ישראל");
    applyGuess(p, st, "b2", "בירה");
    applyGuess(p, st, "b0", "ירושלים");
    const s = computeScore(p, st);
    expect(s.rank).not.toBe("kingmaker");
    expect(s.finalScore).toBe(100 - 2 * 2 - 5);
  });
});
