import { describe, expect, it } from "vitest";
import { buildPuzzle } from "../puzzle/build";
import { applyGuessToSolvableLeaf, applyPeek, createGameState, isPuzzleComplete } from "../puzzle/engine";
import { isPristine, parseProgress, pickProgress, restoreGame, serializeGame } from "../progress";
import type { SavedProgress } from "../progress";

const puzzle = () =>
  buildPuzzle({
    id: "nested",
    date: "2026-01-01",
    finalSentence: "ירושלים בירה",
    bracketString: "[[inner] capital] [tail]",
    specs: [{ answer: "ירושלים" }, { answer: "ישראל" }, { answer: "בירה" }],
  });

describe("progress", () => {
  it("round-trips a half-solved game through JSON", () => {
    const p = puzzle();
    const g = createGameState(p);
    applyGuessToSolvableLeaf(p, g, "ישראל");
    applyGuessToSolvableLeaf(p, g, "טעות");
    applyPeek(p, g, "b2");
    const back = restoreGame(p, JSON.parse(JSON.stringify(serializeGame(g))))!;
    expect([...back.solved]).toEqual([...g.solved]);
    expect(back.solveOrder).toEqual(g.solveOrder);
    expect(back.wrongGuesses).toBe(1);
    expect([...back.peeks]).toEqual(["b2"]);
    expect(back.startedAt).toBe(g.startedAt);
    expect(back.activeNodeId && back.solved.has(back.activeNodeId)).toBeFalsy();
  });

  it("restores a finished game as finished", () => {
    const p = puzzle();
    const g = createGameState(p);
    for (const a of ["ישראל", "ירושלים", "בירה"]) applyGuessToSolvableLeaf(p, g, a);
    const back = restoreGame(p, serializeGame(g))!;
    expect(isPuzzleComplete(p.tree, back.solved)).toBe(true);
  });

  it("drops ids the puzzle no longer has and rejects junk", () => {
    const p = puzzle();
    const saved = { ...serializeGame(createGameState(p)), solved: ["b1", "zz"], solveOrder: ["zz", "b1"] };
    const back = restoreGame(p, saved)!;
    expect([...back.solved]).toEqual(["b1"]);
    expect(back.solveOrder).toEqual(["b1"]);
    expect(restoreGame(p, null)).toBeNull();
    expect(restoreGame(p, { v: 2 })).toBeNull();
    expect(parseProgress("{not json")).toBeNull();
  });

  it("prefers the save that is further along", () => {
    const base = serializeGame(createGameState(puzzle()), 1);
    const one: SavedProgress = { ...base, solved: ["b1"], updatedAt: 1 };
    const two: SavedProgress = { ...base, solved: ["b1", "b2"], updatedAt: 0 };
    const done: SavedProgress = { ...base, solved: ["b1"], completedAt: 5 };
    expect(pickProgress(one, two)).toBe(two);
    expect(pickProgress(two, done)).toBe(done);
    expect(pickProgress(null, one)).toBe(one);
  });

  it("treats an untouched game as nothing to save", () => {
    expect(isPristine(createGameState(puzzle()))).toBe(true);
  });
});
