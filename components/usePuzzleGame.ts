"use client";

import { useCallback, useEffect, useMemo, useReducer } from "react";
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

interface InternalState {
  game: GameState;
  input: string;
  shakeNodeId: string | null;
  popNodeId: string | null;
}

type Action =
  | { type: "setActive"; nodeId: string | null }
  | { type: "setInput"; value: string }
  | { type: "submit"; puzzle: Puzzle }
  | { type: "peekNode"; puzzle: Puzzle; nodeId: string }
  | { type: "revealNode"; puzzle: Puzzle; nodeId: string }
  | { type: "clearPop" }
  | { type: "clearShake" };

function cloneGame(g: GameState): GameState {
  return {
    ...g,
    solved: new Set(g.solved),
    peeks: new Set(g.peeks),
    reveals: new Set(g.reveals),
    solveOrder: [...g.solveOrder],
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
    case "clearPop":
      return { ...state, popNodeId: null };
    case "clearShake":
      return { ...state, shakeNodeId: null };
  }
}

export function usePuzzleGame(puzzle: Puzzle) {
  const [state, dispatch] = useReducer(
    reducer,
    undefined,
    (): InternalState => ({
      game: createGameState(puzzle),
      input: "",
      shakeNodeId: null,
      popNodeId: null,
    }),
  );

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
    setActive,
    setInputValue,
    submit,
    peekNode,
    revealNode,
  } as const;
}

export type UsePuzzleGame = ReturnType<typeof usePuzzleGame>;
export type { PuzzleNode };
