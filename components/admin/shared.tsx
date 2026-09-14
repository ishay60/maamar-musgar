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
      className="puzzle-mono text-[12px] text-center py-4"
      style={{ color: tone === "error" ? "#b91c1c" : "#9ca3af" }}
    >
      {text}
    </div>
  );
}
