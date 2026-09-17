"use client";

import { useEffect, useState } from "react";
import { applyCompletion, emptyStreak } from "@/lib/streak";
import type { StreakData } from "@/lib/streak";

const KEY = "maamar-musgar:streak-v1";
const LEGACY_KEY = "bc-he:streak-v1";

function load(): StreakData {
  if (typeof window === "undefined") return emptyStreak;
  try {
    const raw = localStorage.getItem(KEY) ?? localStorage.getItem(LEGACY_KEY);
    if (!raw) return emptyStreak;
    return { ...emptyStreak, ...JSON.parse(raw) };
  } catch {
    return emptyStreak;
  }
}

function save(data: StreakData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* quota or disabled — ignore */
  }
}

/** `seed` is the signed-in player's server history; it wins over the local cache when present. */
export function useStreak(today: string, seed?: StreakData) {
  const [data, setData] = useState<StreakData>(emptyStreak);

  useEffect(() => {
    const local = load();
    const next = seed ? { ...seed, completed: { ...local.completed, ...seed.completed } } : local;
    setData(next);
    if (seed) save(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recordCompletion = (puzzleDate: string, score: number, rank: string) => {
    setData((prev) => {
      const next = applyCompletion(prev, puzzleDate, today, score, rank);
      if (next !== prev) save(next);
      return next;
    });
  };

  return { data, recordCompletion };
}
