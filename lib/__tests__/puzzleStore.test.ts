import { describe, expect, it } from "vitest";
import { inputToRow, rowToInput } from "../puzzleStore";
import type { StoredPuzzle } from "../puzzleStore";

describe("puzzle row mapping", () => {
  it("round-trips a puzzle through the row shape", () => {
    const p: StoredPuzzle = {
      id: "he-2026-09-14",
      date: "2026-09-14",
      status: "draft",
      bracketString: "ב[חיה]",
      specs: [{ answer: "שר", acceptedAnswers: [], clueType: "trivia", difficulty: "easy" }],
      finalSentence: "בשר",
      tags: ["מבחן"],
    };
    expect(rowToInput(inputToRow(p))).toEqual(p);
  });
});
