import type { Puzzle } from "./types";
import type { GameState } from "./engine";
import { collectBrackets } from "./parser";
import { formatHebrewDate } from "../calendar";

/**
 * Spoiler-free share grid, Wordle-style.
 * - 🟩 solved clean
 * - 🟧 solved after a wrong guess
 * - 🟨 solved after peek
 * - 🟥 revealed
 * Order follows the player's solve order (matches bracket.city); falls back to
 * DFS for any bracket that wasn't solved via the tracked path.
 */
export function buildShareGrid(puzzle: Puzzle, state: GameState): string {
  const brackets = collectBrackets(puzzle.tree);
  const seen = new Set<string>();
  const orderedIds: string[] = [];
  for (const id of state.solveOrder) {
    if (!seen.has(id) && state.solved.has(id)) {
      seen.add(id);
      orderedIds.push(id);
    }
  }
  // Append any solved brackets that weren't in solveOrder (defensive).
  for (const n of brackets) {
    if (state.solved.has(n.id) && !seen.has(n.id)) {
      orderedIds.push(n.id);
      seen.add(n.id);
    }
  }
  const byId = new Map(brackets.map((n) => [n.id, n]));
  const squares = orderedIds.map((id) => {
    const n = byId.get(id);
    if (!n) return "⬜";
    if (state.reveals.has(n.id)) return "🟥";
    if (state.peeks.has(n.id)) return "🟨";
    if (state.wrongByNode[n.id]) return "🟧";
    return "🟩";
  });
  // Wrap into rows of 7 for visual density, matching bracket.city-ish share cards
  const rows: string[] = [];
  for (let i = 0; i < squares.length; i += 7) {
    rows.push(squares.slice(i, i + 7).join(""));
  }
  return rows.join("\n");
}

export function buildShareText(
  puzzle: Puzzle,
  state: GameState,
  extras: { finalScore: number; rankLabel: string; streak: number },
): string {
  return [
    `מאמר מוסגר · ${formatHebrewDate(puzzle.date)}`,
    buildShareGrid(puzzle, state),
    `⭐ ${extras.rankLabel} · ${extras.finalScore} נק׳` +
      (state.wrongGuesses > 0 ? ` · ✗ ${state.wrongGuesses}` : "") +
      (extras.streak > 0 ? ` · 🔥 רצף ${extras.streak}` : ""),
  ].join("\n");
}
