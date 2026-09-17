"use client";

import { computeLiveScore, DIFFICULTY_EMOJI, DIFFICULTY_LABEL_HE } from "@/lib/puzzle";
import type { Puzzle } from "@/lib/puzzle";
import type { UsePuzzleGame } from "./usePuzzleGame";
import { formatHebrewDate } from "@/lib/calendar";

export function HUD({
  puzzle,
  game,
  streak,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  onShowHelp,
  onShowCalendar,
  onShowStats,
}: {
  puzzle: Puzzle;
  game: UsePuzzleGame;
  streak: number;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onShowHelp: () => void;
  onShowCalendar: () => void;
  onShowStats: () => void;
}) {
  const liveScore = computeLiveScore(puzzle, game.game);
  const solvedCount = game.game.solved.size;
  const difficulty = puzzle.difficulty;
  const difficultyEmoji = difficulty ? DIFFICULTY_EMOJI[difficulty] : "🟢";
  const difficultyLabel = difficulty ? DIFFICULTY_LABEL_HE[difficulty] : null;

  return (
    <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#e7e0d0]">
      <button
        type="button"
        aria-label="עזרה"
        onClick={onShowHelp}
        className="w-8 h-8 rounded-full border border-[#e7e0d0] text-[#6b6356] hover:bg-[#e7e0d0]/40 transition flex items-center justify-center puzzle-mono"
      >
        ?
      </button>

      <div className="flex-1 text-center">
        <div
          className="puzzle-mono text-[15px] tracking-wider uppercase"
          title={difficultyLabel ? `רמת קושי: ${difficultyLabel}` : undefined}
        >
          <span aria-label={difficultyLabel ? `רמת קושי ${difficultyLabel}` : undefined}>
            {difficultyEmoji}
          </span>{" "}
          [מאמר מוסגר]{" "}
          <span aria-hidden="true">{difficultyEmoji}</span>
        </div>
        <div className="puzzle-mono text-[12px] text-[#6b6356] mt-0.5 flex items-center justify-center gap-2">
          <NavArrow direction="prev" disabled={!hasPrev} onClick={onPrev} />
          <span>{formatHebrewDate(puzzle.date)}</span>
          <NavArrow direction="next" disabled={!hasNext} onClick={onNext} />
        </div>
        <div className="puzzle-mono text-[11px] text-[#6b6356] mt-0.5">
          🔥 רצף: {streak} · ניקוד: {liveScore} · {solvedCount}/{puzzle.totalBrackets}
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <IconButton label="לוח חידות" onClick={onShowCalendar}>📅</IconButton>
        <IconButton label="הסטטיסטיקות שלי" onClick={onShowStats}>👤</IconButton>
      </div>
    </div>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="w-8 h-8 rounded-full border border-[#e7e0d0] hover:bg-[#e7e0d0]/40 transition flex items-center justify-center text-[14px]"
    >
      {children}
    </button>
  );
}

function NavArrow({
  direction,
  disabled,
  onClick,
}: {
  direction: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  // In RTL: "prev" (older) points right (←), "next" (newer) points left (→)
  // From the reader's perspective, "back" = later-in-text = right arrow glyph.
  const glyph = direction === "prev" ? "→" : "←";
  return (
    <button
      type="button"
      aria-label={direction === "prev" ? "פאזל קודם" : "פאזל הבא"}
      onClick={onClick}
      disabled={disabled}
      className="px-1 disabled:opacity-25 disabled:cursor-not-allowed hover:opacity-100 opacity-80 transition"
    >
      {glyph}
    </button>
  );
}
