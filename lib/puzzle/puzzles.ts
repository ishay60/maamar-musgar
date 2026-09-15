import { buildPuzzle } from "./build";
import type { BuildPuzzleInput } from "./build";
import type { Puzzle } from "./types";

export function buildAll(inputs: BuildPuzzleInput[]): Puzzle[] {
  return inputs.map(buildPuzzle).sort((a, b) => a.date.localeCompare(b.date));
}

/** Today's date (YYYY-MM-DD) in Israel — puzzles roll over at Israeli midnight. */
export function todayInIsrael(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(now);
}
