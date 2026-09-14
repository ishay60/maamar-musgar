"use client";

import { useMemo, useState } from "react";
import { buildShareText, computeScore, RANK_LABEL_HE } from "@/lib/puzzle";
import type { Puzzle } from "@/lib/puzzle";
import type { UsePuzzleGame } from "./usePuzzleGame";

export function EndGameScreen({
  puzzle,
  game,
  streak,
  longestStreak,
}: {
  puzzle: Puzzle;
  game: UsePuzzleGame;
  streak: number;
  longestStreak: number;
}) {
  const score = computeScore(puzzle, game.game);
  const rankLabel = RANK_LABEL_HE[score.rank];
  const efficiencyPct =
    score.efficiency != null ? Math.round(score.efficiency * 100) : null;
  const rankColor =
    score.rank === "kingmaker"
      ? "#b45309"
      : score.rank === "mayor"
      ? "#047857"
      : score.rank === "commuter"
      ? "#0369a1"
      : "#4b5563";

  const shareText = useMemo(
    () => buildShareText(puzzle, game.game, { finalScore: score.finalScore, rankLabel, streak }),
    [puzzle, game.game, score.finalScore, rankLabel, streak],
  );
  const previewText = useMemo(
    () =>
      buildShareText(
        puzzle,
        game.game,
        { finalScore: score.finalScore, rankLabel, streak },
        { includeLink: false },
      ),
    [puzzle, game.game, score.finalScore, rankLabel, streak],
  );

  const [copied, setCopied] = useState(false);
  const share = async () => {
    try {
      if (typeof navigator !== "undefined" && "share" in navigator) {
        await (navigator as any).share({ text: shareText });
        return;
      }
    } catch {
      /* user dismissed */
    }
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* fallback below */
    }
  };

  return (
    <section
      className="mt-6 rounded-xl p-5 sm:p-6"
      style={{
        backgroundColor: "#ecfdf5",
        border: "2px solid #86efac",
      }}
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="puzzle-mono text-[12px] tracking-wider uppercase" style={{ color: "#047857" }}>
            נפתר!
          </div>
          <div className="text-3xl font-bold mt-1" style={{ color: rankColor, fontFamily: '"David Libre", serif' }}>
            {score.rank === "kingmaker" ? "⭐ " : ""}
            {rankLabel}
          </div>
        </div>
        <div className="text-left">
          <div className="puzzle-mono text-[12px]" style={{ color: "#6b6356" }}>
            ניקוד סופי
          </div>
          <div className="text-4xl font-bold tabular-nums" style={{ fontFamily: '"IBM Plex Mono", monospace' }}>
            {score.finalScore}
          </div>
        </div>
      </div>

      <div
        className="mt-5 rounded-lg p-4 text-lg"
        style={{ backgroundColor: "#ffffff", border: "1px solid #e7e0d0", fontFamily: '"David Libre", serif' }}
      >
        {puzzle.finalSentence}
      </div>

      {puzzle.historicalContext ? (
        <div
          className="mt-3 text-[14px] leading-relaxed"
          style={{ color: "#4b5563", fontFamily: '"David Libre", serif' }}
        >
          {puzzle.historicalContext}
        </div>
      ) : null}

      <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2 puzzle-mono text-[12px]">
        <Breakdown label="בסיס" value={score.base} />
        <Breakdown
          label="טעויות"
          value={
            game.game.wrongGuesses > 0
              ? `${game.game.wrongGuesses} · −${score.wrongPenalty}`
              : "0"
          }
          warn={game.game.wrongGuesses > 0}
        />
        <Breakdown
          label="הצצות"
          value={
            game.game.peeks.size > 0
              ? `${game.game.peeks.size} · −${score.peekPenalty}`
              : "0"
          }
          warn={game.game.peeks.size > 0}
        />
        <Breakdown
          label="חשיפות"
          value={
            game.game.reveals.size > 0
              ? `${game.game.reveals.size} · −${score.revealPenalty}`
              : "0"
          }
          warn={game.game.reveals.size > 0}
        />
      </div>

      <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2 puzzle-mono text-[12px]">
        <Breakdown
          label="יעילות הקלדה"
          value={efficiencyPct != null ? `${efficiencyPct}%` : "—"}
        />
        <Breakdown label="רצף נוכחי" value={`🔥 ${streak}`} />
        <Breakdown label="רצף שיא" value={`★ ${longestStreak}`} />
      </div>

      <div
        className="mt-5 rounded-lg p-4 puzzle-mono text-[15px] whitespace-pre-wrap text-center"
        style={{ backgroundColor: "#ffffff", border: "1px solid #e7e0d0" }}
        aria-label="גריד שיתוף"
      >
        {previewText}
      </div>

      <div className="mt-3 flex flex-wrap gap-2 justify-end">
        <button
          type="button"
          onClick={share}
          className="px-4 py-2 rounded-md puzzle-mono text-[13px]"
          style={{ backgroundColor: "#171412", color: "#fbfaf4" }}
        >
          {copied ? "✓ הועתק" : "שתפו תוצאה"}
        </button>
      </div>
    </section>
  );
}

function Breakdown({
  label,
  value,
  warn = false,
}: {
  label: string;
  value: string | number;
  warn?: boolean;
}) {
  return (
    <div
      className="rounded-md px-3 py-2"
      style={{ backgroundColor: "#ffffff", border: "1px solid #e7e0d0" }}
    >
      <div style={{ color: "#6b6356" }}>{label}</div>
      <div
        style={{
          fontWeight: 600,
          color: warn ? "#b45309" : "#171412",
        }}
      >
        {value}
      </div>
    </div>
  );
}
