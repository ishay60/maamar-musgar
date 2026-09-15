import type { Puzzle, PuzzleNode } from "./types";
import { isCorrectAnswer } from "./hebrew";

export type Rank = "tourist" | "commuter" | "mayor" | "kingmaker";

export interface GameState {
  puzzleId: string;
  startedAt: number;
  completedAt: number | null;
  solved: Set<string>;
  /** Bracket IDs in the order they were solved (including reveals). */
  solveOrder: string[];
  wrongGuesses: number;
  /** Wrong guesses per bracket id; drives the 🟧 square in the share grid. */
  wrongByNode: Record<string, number>;
  peeks: Set<string>;
  reveals: Set<string>;
  keystrokes: number;
  activeNodeId: string | null;
  lastWrongNodeId: string | null;
  lastWrongAt: number;
}

export function createGameState(puzzle: Puzzle): GameState {
  const first = firstSolvable(puzzle.tree, new Set());
  return {
    puzzleId: puzzle.id,
    startedAt: Date.now(),
    completedAt: null,
    solved: new Set(),
    solveOrder: [],
    wrongGuesses: 0,
    wrongByNode: {},
    peeks: new Set(),
    reveals: new Set(),
    keystrokes: 0,
    activeNodeId: first?.id ?? null,
    lastWrongNodeId: null,
    lastWrongAt: 0,
  };
}

/** A bracket node is solvable iff every descendant bracket is solved. */
export function isNodeSolvable(node: PuzzleNode, solved: Set<string>): boolean {
  if (node.type !== "bracket") return false;
  if (solved.has(node.id)) return false;
  return descendantBracketsSolved(node, solved);
}

function descendantBracketsSolved(node: PuzzleNode, solved: Set<string>): boolean {
  for (const child of node.children ?? []) {
    if (child.type === "bracket") {
      if (!solved.has(child.id)) return false;
      if (!descendantBracketsSolved(child, solved)) return false;
    } else if (child.type === "root") {
      if (!descendantBracketsSolved(child, solved)) return false;
    }
  }
  return true;
}

export function getSolvableLeaves(tree: PuzzleNode, solved: Set<string>): PuzzleNode[] {
  const out: PuzzleNode[] = [];
  const visit = (n: PuzzleNode) => {
    if (n.type === "bracket" && isNodeSolvable(n, solved)) {
      out.push(n);
      return;
    }
    n.children?.forEach(visit);
  };
  visit(tree);
  return out;
}

function firstSolvable(tree: PuzzleNode, solved: Set<string>): PuzzleNode | null {
  return getSolvableLeaves(tree, solved)[0] ?? null;
}

export function isPuzzleComplete(tree: PuzzleNode, solved: Set<string>): boolean {
  let total = 0;
  const visit = (n: PuzzleNode) => {
    if (n.type === "bracket") total++;
    n.children?.forEach(visit);
  };
  visit(tree);
  return solved.size === total;
}

export type GuessResult =
  | { ok: true; solvedNodeId: string; newlySolvable: PuzzleNode[]; complete: boolean }
  | { ok: false; reason: "locked" | "wrong" | "unknown-node" };

/**
 * Applies a guess to state. Mutates state in place and returns a result
 * describing what happened so the UI can animate appropriately.
 */
export function applyGuess(
  puzzle: Puzzle,
  state: GameState,
  nodeId: string,
  guess: string,
): GuessResult {
  const node = findNode(puzzle.tree, nodeId);
  if (!node || node.type !== "bracket") return { ok: false, reason: "unknown-node" };
  if (!isNodeSolvable(node, state.solved)) return { ok: false, reason: "locked" };

  if (!isCorrectAnswer(guess, node.answer ?? "", node.acceptedAnswers)) {
    state.wrongGuesses += 1;
    state.wrongByNode[node.id] = (state.wrongByNode[node.id] ?? 0) + 1;
    state.lastWrongNodeId = node.id;
    state.lastWrongAt = Date.now();
    return { ok: false, reason: "wrong" };
  }

  return markSolved(puzzle, state, node);
}

/** Records `node` as solved and advances the active leaf. Shared by guess + reveal. */
function markSolved(puzzle: Puzzle, state: GameState, node: PuzzleNode): GuessResult {
  const before = new Set(state.solved);
  state.solved.add(node.id);
  state.solveOrder = [...state.solveOrder, node.id];

  const wasSolvable = new Set(getSolvableLeaves(puzzle.tree, before).map((n) => n.id));
  const nowSolvable = getSolvableLeaves(puzzle.tree, state.solved);
  const actuallyNew = nowSolvable.filter((n) => !wasSolvable.has(n.id));

  const complete = isPuzzleComplete(puzzle.tree, state.solved);
  if (complete && state.completedAt == null) state.completedAt = Date.now();

  if (state.activeNodeId === node.id) {
    state.activeNodeId = nowSolvable[0]?.id ?? null;
  }

  return { ok: true, solvedNodeId: node.id, newlySolvable: actuallyNew, complete };
}

/**
 * A typed answer is accepted for any currently solvable leaf, not only
 * the visually active one. Prefer the active leaf when there is ambiguity.
 */
export function applyGuessToSolvableLeaf(
  puzzle: Puzzle,
  state: GameState,
  guess: string,
): GuessResult {
  const leaves = getSolvableLeaves(puzzle.tree, state.solved);
  if (leaves.length === 0) return { ok: false, reason: "unknown-node" };

  const active = leaves.find((n) => n.id === state.activeNodeId);
  const orderedLeaves = active ? [active, ...leaves.filter((n) => n.id !== active.id)] : leaves;
  const match = orderedLeaves.find((node) =>
    isCorrectAnswer(guess, node.answer ?? "", node.acceptedAnswers),
  );

  if (!match) {
    state.wrongGuesses += 1;
    state.lastWrongNodeId = state.activeNodeId ?? leaves[0]?.id ?? null;
    if (state.lastWrongNodeId) {
      state.wrongByNode[state.lastWrongNodeId] = (state.wrongByNode[state.lastWrongNodeId] ?? 0) + 1;
    }
    state.lastWrongAt = Date.now();
    return { ok: false, reason: "wrong" };
  }

  return applyGuess(puzzle, state, match.id, guess);
}

export function applyPeek(puzzle: Puzzle, state: GameState, nodeId: string): boolean {
  const node = findNode(puzzle.tree, nodeId);
  if (!node || node.type !== "bracket") return false;
  if (!isNodeSolvable(node, state.solved)) return false;
  state.peeks.add(node.id);
  return true;
}

export function applyReveal(puzzle: Puzzle, state: GameState, nodeId: string): GuessResult {
  const node = findNode(puzzle.tree, nodeId);
  if (!node || node.type !== "bracket") return { ok: false, reason: "unknown-node" };
  if (!isNodeSolvable(node, state.solved)) return { ok: false, reason: "locked" };

  state.reveals.add(node.id);
  return markSolved(puzzle, state, node);
}

export function findNode(tree: PuzzleNode, id: string): PuzzleNode | null {
  if (tree.id === id) return tree;
  for (const child of tree.children ?? []) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
}

