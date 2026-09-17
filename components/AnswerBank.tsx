"use client";

import { clueSummary, collectBrackets } from "@/lib/puzzle";
import type { PuzzleNode } from "@/lib/puzzle";
import type { UsePuzzleGame } from "./usePuzzleGame";

/**
 * Lists solved brackets as "[clue] = answer" in solve order, like bracket.city's
 * Answer Bank. Peeked-but-unsolved brackets show their first letter; revealed
 * answers get a rose underline.
 */
export function AnswerBank({ tree, game }: { tree: PuzzleNode; game: UsePuzzleGame }) {
  const brackets = collectBrackets(tree);
  const byId = new Map(brackets.map((n) => [n.id, n]));
  const entries: Array<{ node: PuzzleNode; kind: "solved" | "revealed" | "peek" }> = [];
  const seen = new Set<string>();
  for (const id of game.game.solveOrder) {
    const n = byId.get(id);
    if (seen.has(id) || !n || !game.game.solved.has(id)) continue;
    seen.add(id);
    entries.push({ node: n, kind: game.game.reveals.has(id) ? "revealed" : "solved" });
  }
  for (const n of brackets) {
    if (!seen.has(n.id) && game.game.peeks.has(n.id) && !game.game.solved.has(n.id)) {
      seen.add(n.id);
      entries.push({ node: n, kind: "peek" });
    }
  }
  return (
    <div className="mt-4 puzzle-mono text-[12px]">
      <div style={{ color: "#6b6356" }}>בנק חידות:</div>
      {entries.length === 0 ? (
        <div style={{ opacity: 0.6 }}>—</div>
      ) : (
        <ul className="mt-1 space-y-1">
          {entries.map(({ node, kind }) => (
            <li
              key={node.id}
              className="rounded-md px-2 py-1.5 leading-snug"
              style={{ border: "1px dashed #d6cdb8", color: "#171412" }}
            >
              <span style={{ color: "#6b6356" }}>[{clueSummary(node)}]</span>
              <span style={{ opacity: 0.5 }}> = </span>
              {kind === "revealed" ? (
                <span className="underline decoration-dotted underline-offset-2" style={{ textDecorationColor: "#f43f5e", backgroundColor: "#d1fae5" }}>
                  {node.answer}
                </span>
              ) : kind === "peek" ? (
                <span>
                  <span style={{ fontWeight: 700 }}>{(node.answer ?? "")[0]}</span>
                  <span style={{ opacity: 0.4 }}>{(node.answer ?? "").slice(1).replace(/\S/g, "·")}</span>
                </span>
              ) : (
                <span style={{ backgroundColor: "#d1fae5" }}>{node.answer}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
