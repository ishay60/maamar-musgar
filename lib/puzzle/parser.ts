import type { BracketSpec, PuzzleNode } from "./types";

/**
 * Parses a bracket string like "B[lord of the _] the b[what you do with food]"
 * into a tree of PuzzleNodes. Bracket nodes are given stable IDs in DFS order
 * (b0, b1, b2, ...), so callers can supply answers as a parallel array.
 *
 * Bracket nodes' `children` contain the ordered text + nested-bracket nodes
 * that make up the clue display. Plain text at the top level lives under
 * the root node's `children`.
 */
export function parseBracketString(input: string): {
  tree: PuzzleNode;
  bracketOrder: PuzzleNode[];
} {
  const root: PuzzleNode = { id: "root", type: "root", children: [] };
  const stack: PuzzleNode[] = [root];
  const bracketOrder: PuzzleNode[] = [];
  let textBuffer = "";
  let bracketIdx = 0;
  let textIdx = 0;

  const top = () => stack[stack.length - 1];

  const flushText = () => {
    if (textBuffer.length === 0) return;
    top().children!.push({
      id: `t${textIdx++}`,
      type: "text",
      content: textBuffer,
    });
    textBuffer = "";
  };

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (ch === "\\" && i + 1 < input.length && (input[i + 1] === "[" || input[i + 1] === "]")) {
      textBuffer += input[i + 1];
      i++;
      continue;
    }
    if (ch === "[") {
      flushText();
      const node: PuzzleNode = {
        id: `b${bracketIdx++}`,
        type: "bracket",
        children: [],
      };
      top().children!.push(node);
      bracketOrder.push(node);
      stack.push(node);
    } else if (ch === "]") {
      flushText();
      if (stack.length <= 1) {
        throw new Error(`Unmatched ']' at position ${i}`);
      }
      stack.pop();
    } else {
      textBuffer += ch;
    }
  }
  flushText();
  if (stack.length > 1) {
    throw new Error("Unmatched '[' — brackets not balanced");
  }
  return { tree: root, bracketOrder };
}

/**
 * Attaches answer metadata to each bracket node, matched by DFS order.
 * Mutates the tree in place and returns it.
 */
export function attachAnswers(
  bracketOrder: PuzzleNode[],
  specs: BracketSpec[],
): void {
  if (bracketOrder.length !== specs.length) {
    throw new Error(
      `Bracket count mismatch: found ${bracketOrder.length} brackets, got ${specs.length} specs`,
    );
  }
  bracketOrder.forEach((node, idx) => {
    const spec = specs[idx];
    node.answer = spec.answer;
    node.acceptedAnswers = spec.acceptedAnswers;
    node.clueType = spec.clueType;
    node.difficulty = spec.difficulty;
  });
}

/** Walks the tree and returns every bracket node in DFS order. */
export function collectBrackets(tree: PuzzleNode): PuzzleNode[] {
  const out: PuzzleNode[] = [];
  const visit = (n: PuzzleNode) => {
    if (n.type === "bracket") out.push(n);
    n.children?.forEach(visit);
  };
  visit(tree);
  return out;
}

/**
 * Reconstructs the final sentence by substituting answers for every bracket.
 * Used to validate that the author's bracket string + answers produce the
 * declared final sentence.
 */
export function reconstructSentence(tree: PuzzleNode): string {
  const visit = (n: PuzzleNode): string => {
    if (n.type === "text") return n.content ?? "";
    if (n.type === "bracket") return n.answer ?? "";
    return (n.children ?? []).map(visit).join("");
  };
  return visit(tree);
}

/** Bracket clue text with nested brackets collapsed to "[…]". */
export function clueSummary(node: PuzzleNode): string {
  return (node.children ?? [])
    .map((c) => (c.type === "text" ? c.content ?? "" : "[…]"))
    .join("");
}
