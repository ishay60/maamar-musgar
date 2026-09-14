"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { computeScore, findNode, RANK_LABEL_HE } from "@/lib/puzzle";
import type { Puzzle } from "@/lib/puzzle";
import { AnswerBank } from "./AnswerBank";
import { Confetti } from "./Confetti";
import { ControlsBar } from "./ControlsBar";
import { EndGameScreen } from "./EndGameScreen";
import { HelpDialog } from "./HelpDialog";
import { HUD } from "./HUD";
import { PuzzleBoard } from "./PuzzleBoard";
import { usePuzzleGame } from "./usePuzzleGame";
import { useStreak } from "./useStreak";

export interface GameContainerProps {
  puzzle: Puzzle;
  /** Published puzzle dates, ascending. Drives prev/next navigation. */
  dates: string[];
  /** Today's date in Israel; only this puzzle counts toward the streak. */
  today: string;
  studioEnabled: boolean;
  previewEnd: boolean;
}

export function GameContainer(props: GameContainerProps) {
  // Keying the instance on puzzle.id gives us a clean hook mount per puzzle,
  // so switching dates fully resets the game state.
  return <GameInstance key={props.puzzle.id} {...props} />;
}

function GameInstance({ puzzle, dates, today, previewEnd, studioEnabled }: GameContainerProps) {
  const router = useRouter();
  const game = usePuzzleGame(puzzle);
  const streak = useStreak(today);
  const [helpOpen, setHelpOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const setDate = (d: string) => router.replace(`/?date=${d}`);

  useEffect(() => {
    if (previewEnd && !game.complete) game.forceComplete();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewEnd, puzzle.id]);

  useEffect(() => {
    if (!game.complete) return;
    const score = computeScore(puzzle, game.game);
    if (!previewEnd) {
      streak.recordCompletion(puzzle.date, score.finalScore, RANK_LABEL_HE[score.rank]);
    }
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
  // puzzle, restore it when scrolled back to the top — mirrors the iOS-y
  // "URL bar hides on scroll" pattern The Atlantic uses on bracket city.
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
