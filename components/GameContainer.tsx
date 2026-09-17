"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { computeScore, findNode, RANK_LABEL_HE } from "@/lib/puzzle";
import type { Puzzle } from "@/lib/puzzle";
import { getDeviceId } from "@/lib/player";
import type { StreakData } from "@/lib/streak";
import { AnswerBank } from "./AnswerBank";
import { CalendarPopover } from "./CalendarPopover";
import { Confetti } from "./Confetti";
import { ControlsBar } from "./ControlsBar";
import { EndGameScreen } from "./EndGameScreen";
import { HelpDialog } from "./HelpDialog";
import { HUD } from "./HUD";
import { PuzzleBoard } from "./PuzzleBoard";
import { StatsDialog } from "./StatsDialog";
import { usePuzzleGame } from "./usePuzzleGame";
import { useStreak } from "./useStreak";

export interface GameContainerProps {
  puzzle: Puzzle;
  /** Published puzzle dates, ascending. Drives prev/next navigation. */
  dates: string[];
  /** Today's date in Israel; only this puzzle counts toward the streak. */
  today: string;
  studioEnabled: boolean;
  /** Signed-in player: email plus server-side history. Null when anonymous. */
  account: { email: string; history: StreakData } | null;
}

/** Mount with `key={puzzle.id}` so switching dates fully resets the game state. */
export function GameContainer({ puzzle, dates, today, studioEnabled, account }: GameContainerProps) {
  const router = useRouter();
  const loginFlag = useSearchParams().get("login");
  const game = usePuzzleGame(puzzle);
  const streak = useStreak(today, account?.history);
  const [helpOpen, setHelpOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(!!loginFlag);
  const [percentile, setPercentile] = useState<{ plays: number; percentile: number } | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const setDate = (d: string) => router.replace(`/?date=${d}`);

  useEffect(() => {
    if (!game.complete) return;
    const score = computeScore(puzzle, game.game);
    streak.recordCompletion(puzzle.date, score.finalScore, RANK_LABEL_HE[score.rank]);
    const g = game.game;
    fetch("/api/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        puzzleId: puzzle.id,
        deviceId: getDeviceId(),
        score: score.finalScore,
        rank: score.rank,
        wrongGuesses: g.wrongGuesses,
        wrongByNode: g.wrongByNode,
        peeks: [...g.peeks],
        reveals: [...g.reveals],
        solveOrder: g.solveOrder,
        durationSeconds: Math.round((Date.now() - g.startedAt) / 1000),
      }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.ok && setPercentile({ plays: d.plays, percentile: d.percentile }))
      .catch(() => {});
    setAnnouncement(
      `נפתר! דרגה ${RANK_LABEL_HE[score.rank]}, ניקוד ${score.finalScore}. המשפט המלא: ${puzzle.finalSentence}.`,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.complete]);

  useEffect(() => {
    if (!game.popNodeId) return;
    const n = findNode(puzzle.tree, game.popNodeId);
    if (n?.answer) setAnnouncement(`נפתר: ${n.answer}`);
  }, [game.popNodeId, puzzle.tree]);

  useEffect(() => {
    if (!game.shakeNodeId) return;
    setAnnouncement("תשובה שגויה");
  }, [game.shakeNodeId]);

  const idx = dates.indexOf(puzzle.date);
  const prev = dates[idx - 1] ?? null;
  const next = dates[idx + 1] ?? null;

  // Mobile drawer behavior: collapse the HUD when the player scrolls into the
  // puzzle, restore it when scrolled back to the top (like a browser URL bar).
  const scrollRef = useRef<HTMLDivElement>(null);
  const [headerHidden, setHeaderHidden] = useState(false);
  const onScrollPuzzle = () => {
    const top = scrollRef.current?.scrollTop ?? 0;
    setHeaderHidden(top > 8);
  };

  return (
    <main className="mx-auto max-w-2xl px-0 sm:px-4 py-0 sm:py-10 h-[100dvh] sm:h-auto flex flex-col sm:block">
      <article
        className="flex-1 sm:flex-none flex sm:block flex-col rounded-none sm:rounded-xl overflow-hidden"
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #e7e0d0",
          boxShadow: "0 1px 0 rgba(0,0,0,0.03), 0 12px 30px -18px rgba(0,0,0,0.15)",
        }}
      >
        <div
          className={
            "shrink-0 overflow-hidden transition-[max-height,opacity] duration-200 ease-out " +
            (headerHidden && !game.complete
              ? "max-h-0 sm:max-h-[200px] opacity-0 sm:opacity-100"
              : "max-h-[200px] opacity-100")
          }
        >
          <div className="px-3 sm:px-6 pt-3 sm:pt-5 pb-3">
            <HUD
              puzzle={puzzle}
              game={game}
              streak={streak.data.current}
              hasPrev={!!prev}
              hasNext={!!next}
              onPrev={() => prev && setDate(prev)}
              onNext={() => next && setDate(next)}
              onShowHelp={() => setHelpOpen(true)}
              onShowCalendar={() => setCalendarOpen(true)}
              onShowStats={() => setStatsOpen(true)}
            />
          </div>
        </div>
        {game.complete ? null : (
          <>
            <div
              ref={scrollRef}
              onScroll={onScrollPuzzle}
              className="flex-1 sm:flex-none overflow-y-auto sm:overflow-visible px-3 sm:px-6 pt-2 sm:pt-6 pb-2"
            >
              <PuzzleBoard tree={puzzle.tree} game={game} />
              <AnswerBank tree={puzzle.tree} game={game} />
            </div>
            <div
              className="shrink-0 px-3 sm:px-6 pb-2 sm:pb-6 pt-2 sm:pt-3"
              style={{ borderTop: "1px solid #e7e0d0" }}
            >
              <ControlsBar game={game} />
            </div>
          </>
        )}
      </article>

      {game.complete ? (
        <EndGameScreen
          puzzle={puzzle}
          game={game}
          streak={streak.data.current}
          longestStreak={streak.data.longest}
          percentile={percentile}
        />
      ) : null}

      <Confetti active={game.complete} />

      <footer
        className="hidden sm:flex mt-6 text-center puzzle-mono text-[11px] items-center justify-center gap-3"
        style={{ color: "#6b6356" }}
      >
        <span>מאמר מוסגר · גרסת עברית</span>
        {studioEnabled ? (
          <>
            <span style={{ opacity: 0.5 }}>·</span>
            <a href="/admin" className="underline-offset-4 hover:underline">סטודיו</a>
          </>
        ) : null}
      </footer>

      <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
      {calendarOpen ? (
        <CalendarPopover
          dates={dates}
          completed={streak.data.completed}
          current={puzzle.date}
          today={today}
          streak={streak.data.current}
          onPick={setDate}
          onClose={() => setCalendarOpen(false)}
        />
      ) : null}
      {statsOpen ? (
        <StatsDialog
          data={streak.data}
          email={account?.email ?? null}
          loginFlag={loginFlag}
          back={`/?date=${puzzle.date}`}
          onClose={() => setStatsOpen(false)}
        />
      ) : null}

      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clip: "rect(0,0,0,0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      >
        {announcement}
      </div>
    </main>
  );
}
