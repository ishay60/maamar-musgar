"use client";

import type { PuzzleNode } from "@/lib/puzzle";
import { clueSummary, Empty } from "./shared";

/**
 * Compact tree visualization for the authoring surface. Each bracket row
 * shows its index (order of appearance), clue skeleton, and answer (if provided). Nested
 * brackets indent. Non-bracket text nodes are rendered dim.
 */
export function TreeView({
  tree,
  answers,
}: {
  tree: PuzzleNode | null;
  answers: string[];
}) {
  if (!tree) return <Empty text={NO_TREE} />;

  const rows: JSX.Element[] = [];
  let bracketIdx = 0;
  const walk = (n: PuzzleNode, depth: number) => {
    if (n.type === "root") {
      (n.children ?? []).forEach((c) => walk(c, depth));
      return;
    }
    if (n.type === "text") {
      const content = (n.content ?? "").trim();
      if (!content) return;
      rows.push(
        <div
          key={`t-${rows.length}`}
          className="puzzle-mono text-[12px] whitespace-pre-wrap text-gray-400"
          style={{ paddingInlineStart: depth * 14 }}
        >
          <span className="opacity-70">·</span> {content}
        </div>,
      );
      return;
    }
    // bracket
    const idx = bracketIdx++;
    const answer = answers[idx] ?? "";
    const summary = clueSummary(n);
    rows.push(
      <div
        key={`b-${idx}`}
        className="puzzle-mono text-[12px] flex items-baseline gap-1 leading-relaxed"
        style={{ paddingInlineStart: depth * 14 }}
      >
        <span
          className="inline-block rounded-sm px-1 min-w-[28px] text-center bg-violet-100 text-violet-900"
        >
          {idx}
        </span>
        <span className="flex-1 truncate text-gray-700" title={summary}>
          {summary || <span className="opacity-40">[ריק]</span>}
        </span>
        <span className="text-muted">→</span>
        <span
          className={`font-semibold min-w-[60px] ${answer ? "text-emerald-800" : "text-amber-700"}`}
        >
          {answer || "חסר"}
        </span>
      </div>,
    );
    (n.children ?? []).forEach((c) => walk(c, depth + 1));
  };
  walk(tree, 0);

  if (rows.length === 0) return <Empty text={NO_TREE} />;
  return <div className="space-y-0.5">{rows}</div>;
}

const NO_TREE = "אין עץ פירוק — ודאו שהסוגריים מאוזנים";
