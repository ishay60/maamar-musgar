"use client";

import type { PuzzleNode } from "@/lib/puzzle";
import { clueSummary, Empty } from "./shared";

export interface AnswerRow {
  answer: string;
  accepted: string; // comma-separated alternatives
  difficulty: "" | "easy" | "medium" | "hard";
  clueType: "" | "definition" | "fill-blank" | "trivia" | "wordplay" | "association";
}

export const emptyAnswerRow = (): AnswerRow => ({
  answer: "",
  accepted: "",
  difficulty: "",
  clueType: "",
});

/**
 * Per-bracket answer editor. One row per bracket in order of appearance, with clue
 * summary, required answer, optional accepted-variants, difficulty, clue type.
 */
export function AnswersTable({
  brackets,
  rows,
  onChange,
}: {
  brackets: PuzzleNode[];
  rows: AnswerRow[];
  onChange: (next: AnswerRow[]) => void;
}) {
  const update = (idx: number, patch: Partial<AnswerRow>) => {
    const next = rows.slice();
    next[idx] = { ...(next[idx] ?? emptyAnswerRow()), ...patch };
    onChange(next);
  };

  if (brackets.length === 0) {
    return <Empty text="אין סוגרים עדיין. הוסיפו סוגרים במחרוזת כדי לערוך תשובות." />;
  }

  return (
    <div className="space-y-2">
      {brackets.map((node, idx) => {
        const summary = clueSummary(node);
        const row = rows[idx] ?? emptyAnswerRow();
        return (
          <div
            key={node.id}
            className="rounded-md p-3 grid grid-cols-1 sm:grid-cols-[28px_1fr_1fr_120px_120px] gap-2 items-start"
            style={{ backgroundColor: "#fbfaf4", border: "1px solid #e7e0d0" }}
          >
            <div
              className="puzzle-mono text-[12px] rounded-sm px-1 text-center"
              style={{ backgroundColor: "#ede9fe", color: "#4c1d95" }}
              title={`סוגר ${idx} (לפי סדר הופעה)`}
            >
              {idx}
            </div>
            <div
              className="text-[13px] leading-snug"
              style={{ color: "#374151", fontFamily: '"David Libre", serif' }}
            >
              {summary || <span style={{ opacity: 0.4 }}>(ריק)</span>}
            </div>
            <input
              type="text"
              dir="auto"
              value={row.answer}
              onChange={(e) => update(idx, { answer: e.target.value })}
              placeholder="תשובה"
              className="rounded-md px-2 py-1 text-[13px] puzzle-mono"
              style={{ border: "1px solid #e7e0d0", backgroundColor: "#ffffff" }}
            />
            <select
              value={row.difficulty}
              onChange={(e) => update(idx, { difficulty: e.target.value as AnswerRow["difficulty"] })}
              className="rounded-md px-2 py-1 text-[12px] puzzle-mono"
              style={{ border: "1px solid #e7e0d0", backgroundColor: "#ffffff" }}
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
              className="rounded-md px-2 py-1 text-[12px] puzzle-mono"
              style={{ border: "1px solid #e7e0d0", backgroundColor: "#ffffff" }}
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
                dir="auto"
                value={row.accepted}
                onChange={(e) => update(idx, { accepted: e.target.value })}
                placeholder="תשובות חלופיות מקובלות (מופרדות בפסיק, אופציונלי)"
                className="w-full rounded-md px-2 py-1 text-[12px] puzzle-mono"
                style={{ border: "1px solid #e7e0d0", backgroundColor: "#ffffff" }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
