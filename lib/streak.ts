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
