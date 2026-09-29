import { collectBrackets } from "./puzzle/parser";
import { createGameState, getSolvableLeaves } from "./puzzle/engine";
import type { GameState } from "./puzzle/engine";
import type { Puzzle } from "./puzzle/types";

/**
 * In-progress (or finished) game for one puzzle, as JSON. Stored per puzzle in
 * localStorage for everyone and in the `progress` table for signed-in players,
 * so leaving a puzzle half-solved and coming back resumes it.
 */
export interface SavedProgress {
  v: 1;
  startedAt: number;
  completedAt: number | null;
  solved: string[];
  solveOrder: string[];
  wrongGuesses: number;
  wrongByNode: Record<string, number>;
  peeks: string[];
  reveals: string[];
  keystrokes: number;
  updatedAt: number;
}

export const PROGRESS_KEY_PREFIX = "maamar-musgar:progress-v1:";
export const progressKey = (puzzleId: string) => PROGRESS_KEY_PREFIX + puzzleId;

export function serializeGame(g: GameState, now = Date.now()): SavedProgress {
  return {
    v: 1,
    startedAt: g.startedAt,
    completedAt: g.completedAt,
    solved: [...g.solved],
    solveOrder: [...g.solveOrder],
    wrongGuesses: g.wrongGuesses,
    wrongByNode: { ...g.wrongByNode },
    peeks: [...g.peeks],
    reveals: [...g.reveals],
    keystrokes: g.keystrokes,
    updatedAt: now,
  };
}

/** Nothing worth saving yet: no solves, no mistakes, no hints. */
export function isPristine(g: GameState): boolean {
  return g.solved.size === 0 && g.wrongGuesses === 0 && g.peeks.size === 0 && g.reveals.size === 0;
}

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : 0);
const strings = (v: unknown) => (Array.isArray(v) ? v.filter((s): s is string => typeof s === "string") : []);

/**
 * Rebuild a GameState from stored JSON. Ids that are not brackets of this
 * puzzle (the puzzle was edited since) are dropped. Returns null for anything
 * unusable so callers fall back to a fresh game.
 */
export function restoreGame(puzzle: Puzzle, saved: unknown): GameState | null {
  if (!saved || typeof saved !== "object") return null;
  const s = saved as Partial<SavedProgress>;
  if (s.v !== 1) return null;
  const ids = new Set(collectBrackets(puzzle.tree).map((n) => n.id));
  const keep = (v: unknown) => strings(v).filter((id) => ids.has(id));
  const solved = new Set(keep(s.solved));
  const wrongByNode: Record<string, number> = {};
  if (s.wrongByNode && typeof s.wrongByNode === "object") {
    for (const [id, n] of Object.entries(s.wrongByNode)) if (ids.has(id) && num(n) > 0) wrongByNode[id] = num(n);
  }
  const fresh = createGameState(puzzle);
  return {
    ...fresh,
    startedAt: num(s.startedAt) || fresh.startedAt,
    completedAt: s.completedAt == null ? null : num(s.completedAt),
    solved,
    solveOrder: keep(s.solveOrder).filter((id) => solved.has(id)),
    wrongGuesses: num(s.wrongGuesses),
    wrongByNode,
    peeks: new Set(keep(s.peeks)),
    reveals: new Set(keep(s.reveals).filter((id) => solved.has(id))),
    keystrokes: num(s.keystrokes),
    activeNodeId: getSolvableLeaves(puzzle.tree, solved)[0]?.id ?? null,
  };
}

/** Of two saves for the same puzzle, the one further along wins; ties go to the newer. */
export function pickProgress(a: SavedProgress | null, b: SavedProgress | null): SavedProgress | null {
  if (!a) return b;
  if (!b) return a;
  const done = (p: SavedProgress) => (p.completedAt != null ? 1 : 0);
  if (done(a) !== done(b)) return done(a) > done(b) ? a : b;
  if (a.solved.length !== b.solved.length) return a.solved.length > b.solved.length ? a : b;
  return (a.updatedAt ?? 0) >= (b.updatedAt ?? 0) ? a : b;
}

/** Parse a stored value, or null. */
export function parseProgress(raw: unknown): SavedProgress | null {
  try {
    const v = typeof raw === "string" ? JSON.parse(raw) : raw;
    return v && typeof v === "object" && (v as SavedProgress).v === 1 && Array.isArray((v as SavedProgress).solved)
      ? (v as SavedProgress)
      : null;
  } catch {
    return null;
  }
}
