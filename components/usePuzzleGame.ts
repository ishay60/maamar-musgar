"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import type { Puzzle, PuzzleNode } from "@/lib/puzzle";
import {
  applyGuessToSolvableLeaf,
  applyPeek,
  applyReveal,
  createGameState,
  findNode,
  getSolvableLeaves,
  isPuzzleComplete,
} from "@/lib/puzzle";
import type { GameState } from "@/lib/puzzle";
import { isPristine, parseProgress, pickProgress, progressKey, restoreGame, serializeGame } from "@/lib/progress";
import type { SavedProgress } from "@/lib/progress";

interface InternalState {
  game: GameState;
  input: string;
  shakeNodeId: string | null;
  popNodeId: string | null;
  /** The puzzle was already finished when loaded from a save: no confetti, no fanfare. */
  restoredComplete: boolean;
}

type Action =
  | { type: "setActive"; nodeId: string | null }
  | { type: "setInput"; value: string }
  | { type: "submit"; puzzle: Puzzle }
  | { type: "peekNode"; puzzle: Puzzle; nodeId: string }
  | { type: "revealNode"; puzzle: Puzzle; nodeId: string }
  | { type: "restore"; game: GameState; complete: boolean }
  | { type: "clearPop" }
  | { type: "clearShake" };

function cloneGame(g: GameState): GameState {
  return {
    ...g,
    solved: new Set(g.solved),
    peeks: new Set(g.peeks),
    reveals: new Set(g.reveals),
    solveOrder: [...g.solveOrder],
    wrongByNode: { ...g.wrongByNode },
  };
}

function reducer(state: InternalState, action: Action): InternalState {
  switch (action.type) {
    case "setActive": {
      if (state.game.activeNodeId === action.nodeId) return state;
      return {
        ...state,
        game: { ...state.game, activeNodeId: action.nodeId },
        input: "",
      };
    }
    case "setInput": {
      if (state.input === action.value) return state;
      const delta = Math.max(0, action.value.length - state.input.length);
      return {
        ...state,
        input: action.value,
        game: { ...state.game, keystrokes: state.game.keystrokes + delta },
      };
    }
    case "submit": {
      const nodeId = state.game.activeNodeId;
      if (!state.input.trim()) return state;
      const nextGame = cloneGame(state.game);
      const res = applyGuessToSolvableLeaf(action.puzzle, nextGame, state.input);
      if (res.ok) {
        return {
          ...state,
          game: nextGame,
          input: "",
          popNodeId: res.solvedNodeId,
          shakeNodeId: null,
        };
      }
      if (res.reason === "wrong") {
        return {
          ...state,
          game: nextGame,
          input: "",
          shakeNodeId: nodeId ?? nextGame.lastWrongNodeId,
          popNodeId: null,
        };
      }
      return state;
    }
    case "peekNode": {
      const nextGame = cloneGame(state.game);
      nextGame.activeNodeId = action.nodeId;
      if (!applyPeek(action.puzzle, nextGame, action.nodeId)) return state;
      return {
        ...state,
        game: nextGame,
        input: "",
      };
    }
    case "revealNode": {
      const nextGame = cloneGame(state.game);
      nextGame.activeNodeId = action.nodeId;
      const res = applyReveal(action.puzzle, nextGame, action.nodeId);
      if (!res.ok) return state;
      return {
        ...state,
        game: nextGame,
        input: "",
        popNodeId: res.solvedNodeId,
      };
    }
    case "restore":
      return { ...state, game: action.game, input: "", popNodeId: null, shakeNodeId: null, restoredComplete: action.complete };
    case "clearPop":
      return { ...state, popNodeId: null };
    case "clearShake":
      return { ...state, shakeNodeId: null };
  }
}

function readLocal(puzzleId: string): SavedProgress | null {
  try {
    return parseProgress(localStorage.getItem(progressKey(puzzleId)));
  } catch {
    return null;
  }
}

/**
 * `saved` is the signed-in player's server copy for this puzzle. It seeds the
 * first render (same on server and client); the localStorage copy is checked
 * after mount and wins if it is further along. `persist: false` (tutorial,
 * editor preview) neither reads nor writes any saved progress.
 */
export function usePuzzleGame(puzzle: Puzzle, saved: SavedProgress | null = null, sync = false, persist = true) {
  const [state, dispatch] = useReducer(
    reducer,
    undefined,
    (): InternalState => {
      const game = restoreGame(puzzle, saved) ?? createGameState(puzzle);
      return {
        game,
        input: "",
        shakeNodeId: null,
        popNodeId: null,
        restoredComplete: isPuzzleComplete(puzzle.tree, game.solved),
      };
    },
  );

  // Resume from this device's copy when it is ahead of the server's.
  useEffect(() => {
    if (!persist) return;
    const local = readLocal(puzzle.id);
    const best = pickProgress(saved, local);
    if (best && best === local && best !== saved) {
      const game = restoreGame(puzzle, best);
      if (game) dispatch({ type: "restore", game, complete: isPuzzleComplete(puzzle.tree, game.solved) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save every change: localStorage now, the server (signed in) after a short pause.
  // The first run is the state we just loaded, so there is nothing new to save.
  const loaded = useRef(false);
  useEffect(() => {
    if (!loaded.current) {
      loaded.current = true;
      return;
    }
    if (!persist || isPristine(state.game)) return;
    const snapshot = serializeGame(state.game);
    try {
      localStorage.setItem(progressKey(puzzle.id), JSON.stringify(snapshot));
    } catch {
      /* quota or disabled: progress just won't survive a reload */
    }
    if (!sync) return;
    const t = setTimeout(() => {
      fetch("/api/progress", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ puzzleId: puzzle.id, state: snapshot }),
        keepalive: true,
      }).catch(() => {});
    }, 800);
    return () => clearTimeout(t);
  }, [state.game, puzzle.id, sync, persist]);

  const activeNode = state.game.activeNodeId
    ? findNode(puzzle.tree, state.game.activeNodeId)
    : null;

  const solvableLeaves = useMemo(
    () => getSolvableLeaves(puzzle.tree, state.game.solved),
    [puzzle.tree, state.game.solved],
  );

  const complete = useMemo(
    () => isPuzzleComplete(puzzle.tree, state.game.solved),
    [puzzle.tree, state.game.solved],
  );

  const setActive = useCallback((nodeId: string | null) => {
    dispatch({ type: "setActive", nodeId });
  }, []);

  const setInputValue = useCallback((value: string) => {
    dispatch({ type: "setInput", value });
  }, []);

  const submit = useCallback(() => {
    dispatch({ type: "submit", puzzle });
  }, [puzzle]);

  const peekNode = useCallback(
    (nodeId: string) => dispatch({ type: "peekNode", puzzle, nodeId }),
    [puzzle],
  );
  const revealNode = useCallback(
    (nodeId: string) => dispatch({ type: "revealNode", puzzle, nodeId }),
    [puzzle],
  );

  useEffect(() => {
    if (!state.popNodeId) return;
    const t = setTimeout(() => dispatch({ type: "clearPop" }), 1600);
    return () => clearTimeout(t);
  }, [state.popNodeId]);

  useEffect(() => {
    if (!state.shakeNodeId) return;
    const t = setTimeout(() => dispatch({ type: "clearShake" }), 320);
    return () => clearTimeout(t);
  }, [state.shakeNodeId]);

  // Auto-advance active if it was cleared by a solve and there's a new leaf
  useEffect(() => {
    if (complete) return;
    if (state.game.activeNodeId) {
      const n = findNode(puzzle.tree, state.game.activeNodeId);
      if (!n || state.game.solved.has(state.game.activeNodeId)) {
        dispatch({ type: "setActive", nodeId: solvableLeaves[0]?.id ?? null });
      }
      return;
    }
    if (solvableLeaves[0]) {
      dispatch({ type: "setActive", nodeId: solvableLeaves[0].id });
    }
  }, [solvableLeaves, state.game.activeNodeId, state.game.solved, puzzle.tree, complete]);

  // The answer input in ControlsBar owns all typing + Enter/Escape. We
  // keep a tiny global fallback: if the player clicks somewhere off the input
  // and starts typing a printable character, refocus the input so no keystroke
  // is lost (matches bracket.city's "just start typing" affordance).
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (complete) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (e.key.length !== 1) return;
      if (!/[\s\u0590-\u05FFa-zA-Z0-9'"\u05F3\u05F4\-]/.test(e.key)) return;
      const input = document.querySelector<HTMLInputElement>('input[aria-label="תיבת התשובה"]');
      if (input && document.activeElement !== input) input.focus();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [complete]);

  return {
    game: state.game,
    input: state.input,
    activeNode,
    solvableLeaves,
    popNodeId: state.popNodeId,
    shakeNodeId: state.shakeNodeId,
    complete,
    restoredComplete: state.restoredComplete,
    setActive,
    setInputValue,
    submit,
    peekNode,
    revealNode,
  } as const;
}

export type UsePuzzleGame = ReturnType<typeof usePuzzleGame>;
export type { PuzzleNode };
