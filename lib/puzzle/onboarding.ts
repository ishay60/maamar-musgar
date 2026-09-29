import { buildPuzzle } from "./build";
import type { BuildPuzzleInput } from "./build";
import type { Puzzle } from "./types";

/**
 * The first puzzle a new player sees (/?tutorial=1). It never counts toward
 * results or the streak. Edit freely: it only has to build (see the test in
 * lib/__tests__/onboarding.test.ts), and it should teach the three rules:
 * a leaf first, a sibling in any order, and a parent that opens once its
 * child is solved.
 */
export const ONBOARDING_INPUT: BuildPuzzleInput = {
  id: "onboarding",
  date: "2000-01-01",
  bracketString: "[מילת ברכה ופרידה], ברוכים הבאים ל[עיר הבירה של [המדינה שבה נמצא הכותל]]",
  specs: [
    { answer: "שלום", clueType: "definition", difficulty: "easy" },
    { answer: "ירושלים", clueType: "definition", difficulty: "easy" },
    { answer: "ישראל", acceptedAnswers: ["מדינת ישראל"], clueType: "definition", difficulty: "easy" },
  ],
  finalSentence: "שלום, ברוכים הבאים לירושלים",
  difficulty: "easy",
};

export const ONBOARDING_PUZZLE: Puzzle = buildPuzzle(ONBOARDING_INPUT);

/** localStorage flag: this browser has seen the welcome (played or skipped the intro). */
export const ONBOARDED_KEY = "maamar-musgar:onboarded-v1";
