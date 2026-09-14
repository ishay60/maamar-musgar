import { buildPuzzle } from "./build";
import type { BuildPuzzleInput } from "./build";
import type { Puzzle } from "./types";
import puzzleInputs from "@/data/puzzles.json";

/** Every authored puzzle, sorted by date ascending. Source of truth: data/puzzles.json. */
export const puzzles: Puzzle[] = (puzzleInputs as BuildPuzzleInput[])
  .map(buildPuzzle)
  .sort((a, b) => a.date.localeCompare(b.date));

export function findPuzzleByDate(date: string): Puzzle | null {
  return puzzles.find((p) => p.date === date) ?? null;
}

/** Today's date (YYYY-MM-DD) in Israel — puzzles roll over at Israeli midnight. */
export function todayInIsrael(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(now);
}

/** Puzzles players may see: dated today or earlier. Never ships future puzzles. */
export function publishedPuzzles(today = todayInIsrael()): Puzzle[] {
  return puzzles.filter((p) => p.date <= today);
}
