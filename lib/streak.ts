export interface StreakData {
  current: number;
  longest: number;
  lastPuzzleDate: string | null; // ISO yyyy-mm-dd of the last daily puzzle that counted
  completed: Record<string, { score: number; rank: string }>; // per-puzzle-date record
}

export const emptyStreak: StreakData = {
  current: 0,
  longest: 0,
  lastPuzzleDate: null,
  completed: {},
};

export function daysBetween(a: string, b: string): number {
  const ad = new Date(a + "T00:00:00");
  const bd = new Date(b + "T00:00:00");
  return Math.round((bd.getTime() - ad.getTime()) / 86_400_000);
}

/**
 * Record a completed puzzle. Only today's puzzle moves the streak; archive
 * puzzles are recorded as completed but leave current/longest untouched.
 */
export function applyCompletion(
  prev: StreakData,
  puzzleDate: string,
  today: string,
  score: number,
  rank: string,
): StreakData {
  if (prev.completed[puzzleDate]) return prev;
  const completed = { ...prev.completed, [puzzleDate]: { score, rank } };
  if (puzzleDate !== today) return { ...prev, completed };

  const diff = prev.lastPuzzleDate ? daysBetween(prev.lastPuzzleDate, today) : NaN;
  const current = diff === 1 ? prev.current + 1 : 1;
  return {
    current,
    longest: Math.max(prev.longest, current),
    lastPuzzleDate: today,
    completed,
  };
}

/**
 * Streak from the dates of live completions (puzzle solved on its own day).
 * Used for signed-in players, whose history lives on the server.
 */
export function deriveStreak(liveDates: string[], today: string): Pick<StreakData, "current" | "longest" | "lastPuzzleDate"> {
  const dates = [...new Set(liveDates)].sort();
  let longest = 0;
  let run = 0;
  for (let i = 0; i < dates.length; i++) {
    run = i > 0 && daysBetween(dates[i - 1], dates[i]) === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }
  const last = dates[dates.length - 1] ?? null;
  const current = last && daysBetween(last, today) <= 1 ? run : 0;
  return { current, longest, lastPuzzleDate: last };
}
