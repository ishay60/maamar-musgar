import { db } from "./db";
import { clueSummary, parseBracketString } from "./puzzle/parser";
import type { BuildPuzzleInput } from "./puzzle/build";
import type { ClueType, Difficulty } from "./puzzle/types";

export interface LibraryClue {
  clue: string;
  answer: string;
  acceptedAnswers: string[];
  clueType: ClueType | null;
  difficulty: Difficulty | null;
  puzzleId: string;
}

/** Rewrite the puzzle's rows in the clue library. Called after every save. */
export async function syncClues(input: BuildPuzzleInput): Promise<void> {
  const client = db();
  if (!client) return;
  const { bracketOrder } = parseBracketString(input.bracketString);
  const rows = bracketOrder.map((node, position) => ({
    puzzle_id: input.id,
    position,
    clue: clueSummary(node),
    answer: input.specs[position]?.answer ?? "",
    accepted_answers: input.specs[position]?.acceptedAnswers ?? [],
    clue_type: input.specs[position]?.clueType ?? null,
    difficulty: input.specs[position]?.difficulty ?? null,
  }));
  await client.from("clues").delete().eq("puzzle_id", input.id);
  const { error } = await client.from("clues").insert(rows);
  if (error) throw new Error(`Clue library sync failed: ${error.message}`);
}

/** Whole library, newest puzzle first. Small enough to ship to the studio in one go. */
export async function loadClues(): Promise<LibraryClue[]> {
  const client = db();
  if (!client) return [];
  const { data, error } = await client
    .from("clues")
    .select("clue,answer,accepted_answers,clue_type,difficulty,puzzle_id")
    .order("puzzle_id", { ascending: false });
  if (error) throw new Error(`Clue library read failed: ${error.message}`);
  return (data ?? []).map((r) => ({
    clue: r.clue,
    answer: r.answer,
    acceptedAnswers: r.accepted_answers ?? [],
    clueType: r.clue_type,
    difficulty: r.difficulty,
    puzzleId: r.puzzle_id,
  }));
}
