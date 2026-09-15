import { describe, expect, it } from "vitest";
import { buildPuzzle } from "../build";
import { applyGuess, applyGuessToSolvableLeaf, applyPeek, createGameState } from "../engine";
import { buildShareGrid, buildShareText } from "../share";

const puzzle = () =>
  buildPuzzle({
    id: "share",
    date: "2026-01-01",
    finalSentence: "ירושלים בירה",
    bracketString: "[[inner] capital] [tail]",
    specs: [{ answer: "ירושלים" }, { answer: "ישראל" }, { answer: "בירה" }],
  });

describe("share grid", () => {
  it("marks a bracket orange after a wrong guess, yellow after a peek, green when clean", () => {
    const p = puzzle();
    const s = createGameState(p);
    // inner: one wrong guess then right
    expect(applyGuess(p, s, "b1", "לא").ok).toBe(false);
    expect(applyGuess(p, s, "b1", "ישראל").ok).toBe(true);
    // tail: wrong guess typed freely (attributed to the active bracket), then peek, then right
    s.activeNodeId = "b2";
    expect(applyGuessToSolvableLeaf(p, s, "שטות").ok).toBe(false);
    applyPeek(p, s, "b2");
    expect(applyGuess(p, s, "b2", "בירה").ok).toBe(true);
    // outer: clean
    expect(applyGuess(p, s, "b0", "ירושלים").ok).toBe(true);

    expect(buildShareGrid(p, s)).toBe("🟧🟨🟩");
    expect(buildShareText(p, s, { finalScore: 91, rankLabel: "ראש עיר", streak: 0 })).toContain("✗ 2");
  });
});
