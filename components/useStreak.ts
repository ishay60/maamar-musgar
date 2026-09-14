"use client";

import { useEffect, useState } from "react";
import { applyCompletion, emptyStreak } from "@/lib/streak";
import type { StreakData } from "@/lib/streak";

const KEY = "bc-he:streak-v1";

function load(): StreakData {
  if (typeof window === "undefined") return emptyStreak;
  try {
    const raw = localStorage.getItem(KEY);
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

export function useStreak(today: string) {
  const [data, setData] = useState<StreakData>(emptyStreak);

  useEffect(() => {
    setData(load());
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
