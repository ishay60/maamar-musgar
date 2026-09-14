import type { PuzzleNode } from "@/lib/puzzle";

/** Bracket clue text with nested brackets collapsed to "[…]". */
export function clueSummary(node: PuzzleNode): string {
  return (node.children ?? [])
    .map((c) => (c.type === "text" ? c.content ?? "" : "[…]"))
    .join("");
}

export function Empty({ text, tone = "muted" }: { text: string; tone?: "muted" | "error" }) {
  return (
    <div
      className={`puzzle-mono text-[12px] text-center py-4 ${tone === "error" ? "text-red-700" : "text-gray-400"}`}
    >
      {text}
    </div>
  );
}
