"use client";

import type { PuzzleNode } from "@/lib/puzzle";
import type { LibraryClue } from "@/lib/clueLibrary";
import { emptyAnswerRow } from "@/lib/clueRows";
import type { AnswerRow } from "@/lib/clueRows";
import { clueSummary, Empty } from "./shared";

export type { AnswerRow } from "@/lib/clueRows";
export { emptyAnswerRow } from "@/lib/clueRows";

const norm = (s: string) => s.replace(/[\s"'״׳.,?!]/g, "");

/**
 * Per-bracket answer editor, one row per bracket keyed by clue text. Under each
 * row: clues from earlier puzzles that look like this one; click to reuse.
 */
export function AnswersTable({
  brackets,
  rows,
  library,
  editingId,
  onChange,
}: {
  brackets: PuzzleNode[];
  rows: AnswerRow[];
  library: LibraryClue[];
  editingId: string | null;
  onChange: (next: AnswerRow[]) => void;
}) {
  const update = (idx: number, patch: Partial<AnswerRow>) => {
    const next = rows.slice();
    next[idx] = { ...(next[idx] ?? emptyAnswerRow()), ...patch };
    onChange(next);
  };
  const suggest = (clue: string): LibraryClue[] => {
    const key = norm(clue);
    if (key.length < 3) return [];
    const seen = new Set<string>();
    return library
      .filter((c) => c.puzzleId !== editingId && (norm(c.clue).includes(key) || key.includes(norm(c.clue))))
      .filter((c) => !seen.has(c.clue + c.answer) && seen.add(c.clue + c.answer))
      .slice(0, 4);
  };

  if (brackets.length === 0) {
    return <Empty text="אין סוגרים עדיין. הוסיפו סוגרים במחרוזת כדי לערוך תשובות." />;
  }

  return (
    <div className="space-y-2">
      {brackets.map((node, idx) => {
        const summary = clueSummary(node);
        const row = rows[idx] ?? emptyAnswerRow(summary);
        const hits = suggest(summary);
        return (
          <div
            key={node.id}
            className="rounded-md p-3 grid grid-cols-1 sm:grid-cols-[28px_1fr_1fr_120px_120px] gap-2 items-start bg-paper border border-line"
          >
            <div
              className="puzzle-mono text-[12px] rounded-sm px-1 text-center bg-violet-100 text-violet-900"
              title={`סוגר ${idx} (לפי סדר הופעה)`}
            >
              {idx}
            </div>
            <div className="text-[13px] leading-snug text-gray-700 font-hebrew">
              {summary || <span className="opacity-40">(ריק)</span>}
            </div>
            <input
              type="text"
              dir="rtl"
              value={row.answer}
              onChange={(e) => update(idx, { answer: e.target.value })}
              placeholder="תשובה"
              className="rounded-md px-2 py-1 text-[13px] puzzle-mono border border-line bg-white"
            />
            <select
              value={row.difficulty}
              onChange={(e) => update(idx, { difficulty: e.target.value as AnswerRow["difficulty"] })}
              className="rounded-md px-2 py-1 text-[12px] puzzle-mono border border-line bg-white"
              aria-label="קושי"
            >
              <option value="">קושי</option>
              <option value="easy">קל</option>
              <option value="medium">בינוני</option>
              <option value="hard">קשה</option>
            </select>
            <select
              value={row.clueType}
              onChange={(e) => update(idx, { clueType: e.target.value as AnswerRow["clueType"] })}
              className="rounded-md px-2 py-1 text-[12px] puzzle-mono border border-line bg-white"
              aria-label="סוג רמז"
            >
              <option value="">סוג רמז</option>
              <option value="definition">הגדרה</option>
              <option value="trivia">טריוויה</option>
              <option value="fill-blank">השלמה</option>
              <option value="wordplay">משחק מילים</option>
              <option value="association">אסוציאציה</option>
            </select>
            <div className="sm:col-span-5">
              <input
                type="text"
                dir="rtl"
                value={row.accepted}
                onChange={(e) => update(idx, { accepted: e.target.value })}
                placeholder="תשובות חלופיות מקובלות (מופרדות בפסיק, אופציונלי)"
                className="w-full rounded-md px-2 py-1 text-[12px] puzzle-mono border border-line bg-white"
              />
            </div>
            {hits.length ? (
              <div className="sm:col-span-5 flex flex-wrap gap-1.5 items-center puzzle-mono text-[11px]">
                <span className="text-muted">כבר שאלתם:</span>
                {hits.map((c) => (
                  <button
                    key={c.puzzleId + c.clue + c.answer}
                    type="button"
                    title={`מתוך ${c.puzzleId}`}
                    onClick={() =>
                      update(idx, {
                        answer: c.answer,
                        accepted: c.acceptedAnswers.join(", "),
                        difficulty: c.difficulty ?? "",
                        clueType: c.clueType ?? "",
                      })
                    }
                    className="rounded-full px-2 py-0.5 border border-violet-200 bg-violet-50 text-violet-900 hover:bg-violet-100"
                  >
                    [{c.clue}] = {c.answer}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
