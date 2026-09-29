"use client";

import { ONBOARDED_KEY } from "@/lib/puzzle/onboarding";
import type { UsePuzzleGame } from "./usePuzzleGame";

export function markOnboarded(): void {
  try {
    localStorage.setItem(ONBOARDED_KEY, "1");
  } catch {
    /* storage disabled: the welcome may show again, which is harmless */
  }
}

/** First visit on this browser, nothing played yet. */
export function isNewPlayer(): boolean {
  try {
    if (localStorage.getItem(ONBOARDED_KEY)) return false;
    const streak = JSON.parse(localStorage.getItem("maamar-musgar:streak-v1") ?? "null");
    return !(streak && typeof streak === "object" && Object.keys(streak.completed ?? {}).length);
  } catch {
    return false;
  }
}

const panel = { backgroundColor: "#fbfaf4", border: "1px solid #e7e0d0" };
const serif = { fontFamily: '"David Libre", serif' };

/** Offered once to new players: a short guided puzzle, or straight to today's. */
export function WelcomeDialog({ onClose }: { onClose: () => void }) {
  const skip = () => {
    markOnboarded();
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(23,20,18,0.45)" }} onClick={skip} role="dialog" aria-modal="true" aria-label="ברוכים הבאים">
      <div className="w-full max-w-sm rounded-xl p-6" style={panel} onClick={(e) => e.stopPropagation()}>
        <div className="puzzle-mono text-[12px] tracking-wider uppercase" style={{ color: "#6b6356" }}>ברוכים הבאים</div>
        <h2 className="text-2xl font-bold mt-1" style={serif}>[מאמר מוסגר]</h2>
        <p className="mt-3 text-[15px] leading-relaxed" style={serif}>
          בכל יום משפט אחד מסתתר מאחורי סוגריים מקוננים. פותרים את הרמזים מבפנים החוצה עד שהמשפט נחשף.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <a href="/?tutorial=1" onClick={markOnboarded} className="rounded-md px-3 py-2 text-center puzzle-mono text-[13px]" style={{ backgroundColor: "#171412", color: "#fbfaf4" }}>
            [חידת היכרות · דקה אחת]
          </a>
          <button type="button" onClick={skip} className="puzzle-mono text-[12px] underline underline-offset-4" style={{ color: "#6b6356" }}>
            ישר לחידת היום
          </button>
        </div>
      </div>
    </div>
  );
}

/** One line of guidance above the tutorial board, following the player's progress. */
export function TutorialCoach({ game }: { game: UsePuzzleGame }) {
  const g = game.game;
  const solved = g.solved.size;
  const tip =
    g.wrongGuesses > 0 && solved === 0
      ? "לא נורא, טעות עולה רק 2 נקודות. תקועים? [הצצה] חושפת את האות הראשונה."
      : solved === 0
        ? "סוגר מודגש מוכן לפתרון. הקלידו את התשובה ולחצו Enter. אפשר לבחור סוגר אחר בלחיצה עליו."
        : solved === 1
          ? "יפה! תשובה של סוגר פנימי נכתבת בתוך הסוגר שעוטף אותו, וכשכל מה שבפנים נפתר, גם הוא נפתח."
          : "עוד אחד וסיימתם. סוגרים שכנים נפתרים בכל סדר.";
  return (
    <div className="mb-3 rounded-lg px-3 py-2 text-[14px] leading-relaxed" role="status" style={{ backgroundColor: "#eef2ff", border: "1px solid #c7d2fe", ...serif }}>
      <span className="puzzle-mono text-[11px] ml-2" style={{ color: "#4338ca" }}>היכרות</span>
      {tip}
    </div>
  );
}

/** Replaces the results screen at the end of the tutorial. */
export function TutorialFinish({ sentence }: { sentence: string }) {
  return (
    <section className="mt-6 rounded-xl p-5 sm:p-6" style={{ backgroundColor: "#ecfdf5", border: "2px solid #86efac" }}>
      <div className="puzzle-mono text-[12px] tracking-wider uppercase" style={{ color: "#047857" }}>זה כל הסוד</div>
      <div className="mt-3 rounded-lg p-4 text-lg" style={{ backgroundColor: "#ffffff", border: "1px solid #e7e0d0", ...serif }}>{sentence}</div>
      <p className="mt-3 text-[14px] leading-relaxed" style={{ color: "#4b5563", ...serif }}>
        בחידה האמיתית מתחילים מ־100 נקודות. טעות עולה 2, הצצה 5 וחשיפה 20. פתרון נקי זוכה בדרגת בורא המלכים.
      </p>
      <a href="/" className="mt-4 inline-block rounded-md px-4 py-2 puzzle-mono text-[13px]" style={{ backgroundColor: "#171412", color: "#fbfaf4" }}>
        [לחידת היום ←]
      </a>
    </section>
  );
}

/** Editors playing a scheduled puzzle before its date. Nothing is recorded. */
export function PreviewBanner() {
  return (
    <div className="mb-3 rounded-lg px-3 py-2 puzzle-mono text-[12px]" style={{ backgroundColor: "#faf5ff", border: "1px dashed #a78bfa", color: "#6d28d9" }}>
      תצוגה מוקדמת לעורכים: החידה עוד לא פורסמה. התוצאה, הרצף וההתקדמות לא נשמרים.
    </div>
  );
}
