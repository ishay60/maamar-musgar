"use client";

import { useEffect, useState } from "react";
import { applyCompletion, emptyStreak, hydrateStreak } from "@/lib/streak";
import type { StreakData } from "@/lib/streak";

const KEY = "maamar-musgar:streak-v1";
const LEGACY_KEY = "bc-he:streak-v1";

function load(): StreakData {
  if (typeof window === "undefined") return emptyStreak;
  try {
    const raw = localStorage.getItem(KEY) ?? localStorage.getItem(LEGACY_KEY);
    if (!raw) return emptyStreak;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return emptyStreak;
    const completed = parsed.completed && typeof parsed.completed === "object" && !Array.isArray(parsed.completed) ? parsed.completed : {};
    return { ...emptyStreak, ...parsed, completed };
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

/**
 * `seed` is the signed-in player's server history. It is merged with this
 * browser's history (never lowering anything), and any completions the server
 * does not have yet are uploaded to the account.
 */
export function useStreak(today: string, seed?: StreakData) {
  const [data, setData] = useState<StreakData>(emptyStreak);

  useEffect(() => {
    const { data: next, missing } = hydrateStreak(load(), seed, today);
    setData(next);
    if (!seed) return;
    save(next);
    if (missing.length) {
      fetch("/api/results/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: missing }),
      }).catch(() => {});
    }
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
