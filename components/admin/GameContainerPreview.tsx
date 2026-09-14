"use client";

import { useEffect, useRef, useState } from "react";
import type { Puzzle } from "@/lib/puzzle";
import { ControlsBar } from "../ControlsBar";
import { PuzzleBoard } from "../PuzzleBoard";
import { usePuzzleGame } from "../usePuzzleGame";
import { AnswerBank } from "../AnswerBank";

/**
 * Lightweight preview — reuses the player hook + board, skips HUD/nav/streak.
 * Used inside the builder so authors can playtest without leaving the page.
 * Auto-solve walks the current solvable-leaf each tick to validate that the
 * whole tree actually reaches completion with the answers on file.
 */
export function GameContainerPreview({ puzzle }: { puzzle: Puzzle }) {
  const game = usePuzzleGame(puzzle);
  const [autoSolving, setAutoSolving] = useState(false);
  const tRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!autoSolving) return;
    if (game.complete) {
      setAutoSolving(false);
      return;
    }
    const leaf = game.solvableLeaves[0];
    if (!leaf) {
      setAutoSolving(false);
      return;
    }
    tRef.current = setTimeout(() => {
      if (game.game.activeNodeId !== leaf.id) {
        game.setActive(leaf.id);
      }
      game.setInputValue(leaf.answer ?? "");
      // Defer submit so the input state lands first.
      tRef.current = setTimeout(() => game.submit(), 160);
    }, 320);
    return () => {
      if (tRef.current) clearTimeout(tRef.current);
    };
    // `game` is a fresh object every render; listing it would re-arm the timer each tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSolving, game.complete, game.solvableLeaves, game.game.activeNodeId]);

  useEffect(
    () => () => {
      if (tRef.current) clearTimeout(tRef.current);
    },
    [],
  );

  return (
    <div
      className="rounded-md p-3 bg-paper border border-dashed border-stone-300"
    >
      <PuzzleBoard tree={puzzle.tree} game={game} />
      <AnswerBank tree={puzzle.tree} game={game} />
      <div className="mt-3">
        <ControlsBar game={game} />
      </div>
      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => setAutoSolving((v) => !v)}
          disabled={game.complete}
          className="px-3 py-1 rounded-md puzzle-mono text-[12px] disabled:opacity-40 bg-ink text-paper"
          aria-pressed={autoSolving}
        >
          {autoSolving ? "⏸ עצרו" : game.complete ? "✓ הושלם" : "▶ פתרון אוטומטי"}
        </button>
        <span className="puzzle-mono text-[11px] text-muted">
          בודק שכל סוגר נפתר לפי סדר ההופעה — אם נתקע, רמז שיש תשובה חסרה או לא עקבית.
        </span>
      </div>
      {game.complete ? (
        <div
          className="mt-3 rounded-md p-2 puzzle-mono text-[12px] text-center bg-emerald-50 text-emerald-700"
        >
          ✓ נפתר בהצלחה — המשפט המלא: {puzzle.finalSentence}
        </div>
      ) : null}
    </div>
  );
}
