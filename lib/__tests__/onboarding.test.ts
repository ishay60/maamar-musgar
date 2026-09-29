import { describe, expect, it } from "vitest";
import { applyGuessToSolvableLeaf, createGameState, getSolvableLeaves, isPuzzleComplete } from "../puzzle/engine";
import { ONBOARDING_PUZZLE } from "../puzzle/onboarding";

describe("onboarding puzzle", () => {
  it("teaches leaf, sibling and parent, and can be finished", () => {
    const p = ONBOARDING_PUZZLE;
    const g = createGameState(p);
    expect(getSolvableLeaves(p.tree, g.solved)).toHaveLength(2);
    for (const answer of ["ישראל", "ירושלים", "שלום"]) {
      expect(applyGuessToSolvableLeaf(p, g, answer).ok).toBe(true);
    }
    expect(isPuzzleComplete(p.tree, g.solved)).toBe(true);
  });
});
