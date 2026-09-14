import type { BracketSpec, Difficulty, Puzzle, PuzzleNode } from "./types";
import {
  attachAnswers,
  collectBrackets,
  parseBracketString,
  reconstructSentence,
} from "./parser";

export interface BuildPuzzleInput {
  id: string;
  date: string;
  title: string;
  bracketString: string;
  specs: BracketSpec[];
  finalSentence: string;
  historicalContext?: string;
  maxScore?: number;
  tags?: string[];
  difficulty?: Difficulty;
}

export function buildPuzzle(input: BuildPuzzleInput): Puzzle {
  const { tree, bracketOrder } = parseBracketString(input.bracketString);
  attachAnswers(bracketOrder, input.specs);
  const reconstructed = reconstructSentence(tree);
  if (reconstructed.trim() !== input.finalSentence.trim()) {
    throw new Error(
      `Final sentence mismatch.\n  expected: "${input.finalSentence}"\n  got:      "${reconstructed}"`,
    );
  }
  return {
    id: input.id,
    date: input.date,
    title: input.title,
    finalSentence: input.finalSentence,
    historicalContext: input.historicalContext,
    tree,
    totalBrackets: bracketOrder.length,
    maxScore: input.maxScore ?? 100,
    language: "he",
    tags: input.tags ?? [],
    difficulty: input.difficulty,
  };
}

/**
 * Inverse of buildPuzzle for the editor: turns a Puzzle back into the raw
 * fields the builder UI works with (bracket string + per-bracket specs in
 * DFS order). Useful for "edit existing riddle" flows.
 */
export function puzzleToBuildInput(puzzle: Puzzle): BuildPuzzleInput {
  return {
    id: puzzle.id,
    date: puzzle.date,
    title: puzzle.title,
    finalSentence: puzzle.finalSentence,
    historicalContext: puzzle.historicalContext,
    bracketString: serializeTreeToBracketString(puzzle.tree),
    specs: collectBrackets(puzzle.tree).map<BracketSpec>((n) => ({
      answer: n.answer ?? "",
      acceptedAnswers: n.acceptedAnswers,
      clueType: n.clueType,
      difficulty: n.difficulty,
      hint: n.hint,
    })),
    tags: puzzle.tags,
    maxScore: puzzle.maxScore,
    difficulty: puzzle.difficulty,
  };
}

function serializeTreeToBracketString(node: PuzzleNode): string {
  if (node.type === "text") return node.content ?? "";
  const inner = (node.children ?? []).map(serializeTreeToBracketString).join("");
  return node.type === "bracket" ? `[${inner}]` : inner;
}
