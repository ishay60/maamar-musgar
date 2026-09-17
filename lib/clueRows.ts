import type { ClueType, Difficulty } from "./puzzle/types";

/** One bracket's authored answer. `clue` is the key that survives edits to the bracket string. */
export interface AnswerRow {
  clue: string;
  answer: string;
  accepted: string; // comma-separated alternatives
  difficulty: "" | Difficulty;
  clueType: "" | ClueType;
}

export const emptyAnswerRow = (clue = ""): AnswerRow => ({ clue, answer: "", accepted: "", difficulty: "", clueType: "" });

/**
 * Re-pair rows with the brackets now present in the string. Rows follow their
 * clue text, so inserting a bracket in the middle no longer shifts every later
 * answer. Same clue text twice → rows are consumed in order.
 */
export function realignRows(prev: AnswerRow[], clues: string[]): AnswerRow[] {
  const pool = prev.slice();
  return clues.map((clue) => {
    const i = pool.findIndex((r) => r.clue === clue);
    if (i >= 0) return pool.splice(i, 1)[0];
    // Fall back to an unclaimed row with no clue yet (typing while the bracket is still being written).
    const j = pool.findIndex((r) => r.clue === "" || !clues.includes(r.clue));
    if (j >= 0) return { ...pool.splice(j, 1)[0], clue };
    return emptyAnswerRow(clue);
  });
}
