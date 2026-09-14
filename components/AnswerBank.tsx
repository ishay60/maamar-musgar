"use client";

import { collectBrackets } from "@/lib/puzzle";
import type { PuzzleNode } from "@/lib/puzzle";
import type { UsePuzzleGame } from "./usePuzzleGame";

/**
 * Lists revealed/solved answers under the puzzle, in solve order.
 * Mirrors bracket.city's "Answer Bank" — see docs/design-research.md.
 * Peeked-but-unsolved brackets show their first letter; revealed show with a
 * rose underline; clean solves show plain.
 */
export function AnswerBank({
  tree,
  game,
}: {
  tree: PuzzleNode;
  game: UsePuzzleGame;
}) {
  const brackets = collectBrackets(tree);
  const byId = new Map(brackets.map((n) => [n.id, n]));
  const entries: Array<{ node: PuzzleNode; kind: "solved" | "revealed" | "peek" }> = [];
  const seen = new Set<string>();
  // Solved brackets first, in the order the player solved them
  for (const id of game.game.solveOrder) {
    if (seen.has(id)) continue;
    const n = byId.get(id);
    if (!n || !game.game.solved.has(id)) continue;
    seen.add(id);
    entries.push({ node: n, kind: game.game.reveals.has(id) ? "revealed" : "solved" });
  }
  // Then peeked-but-unsolved brackets, in DFS order
  for (const n of brackets) {
    if (seen.has(n.id)) continue;
    if (game.game.peeks.has(n.id) && !game.game.solved.has(n.id)) {
      seen.add(n.id);
      entries.push({ node: n, kind: "peek" });
    }
  }
  if (entries.length === 0) {
    return (
      <div className="mt-4 puzzle-mono text-[12px]" style={{ color: "#6b6356" }}>
        בנק חידות: <span style={{ opacity: 0.6 }}>—</span>
      </div>
    );
  }
  return (
    <div className="mt-4 puzzle-mono text-[12px] flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <span style={{ color: "#6b6356" }}>בנק חידות:</span>
      {entries.map(({ node, kind }, i) => (
        <span
          key={node.id}
          className="inline-flex items-baseline"
          style={{ color: "#171412" }}
        >
          {kind === "revealed" ? (
            <span
              className="underline decoration-dotted underline-offset-2"
              style={{ textDecorationColor: "#f43f5e" }}
            >
              {node.answer}
            </span>
          ) : kind === "peek" ? (
            <span>
              <span style={{ fontWeight: 700 }}>{(node.answer ?? "")[0]}</span>
              <span style={{ opacity: 0.4 }}>
                {(node.answer ?? "").slice(1).replace(/\S/g, "·")}
              </span>
            </span>
          ) : (
            <span>{node.answer}</span>
          )}
          {i < entries.length - 1 ? <span style={{ opacity: 0.4 }}>,</span> : null}
        </span>
      ))}
    </div>
  );
}
