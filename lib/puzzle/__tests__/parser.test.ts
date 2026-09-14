import { describe, expect, it } from "vitest";
import { collectBrackets, parseBracketString, reconstructSentence } from "../parser";
import { buildPuzzle } from "../build";

describe("parseBracketString", () => {
  it("parses flat top-level brackets", () => {
    const { tree, bracketOrder } = parseBracketString("א[ב]ג[ד]ה");
    expect(bracketOrder).toHaveLength(2);
    expect(tree.children).toHaveLength(5);
    expect(tree.children![0]).toMatchObject({ type: "text", content: "א" });
    expect(tree.children![1]).toMatchObject({ type: "bracket", id: "b0" });
    expect(tree.children![3]).toMatchObject({ type: "bracket", id: "b1" });
  });

  it("parses nested brackets in DFS order", () => {
    const { bracketOrder } = parseBracketString("[outer [inner1] mid [inner2]] tail");
    expect(bracketOrder.map((n) => n.id)).toEqual(["b0", "b1", "b2"]);
    const [outer, inner1, inner2] = bracketOrder;
    expect(outer.children).toHaveLength(4);
    expect(outer.children![1]).toBe(inner1);
    expect(outer.children![3]).toBe(inner2);
  });

  it("throws on unmatched brackets", () => {
    expect(() => parseBracketString("[abc")).toThrow();
    expect(() => parseBracketString("abc]")).toThrow();
    expect(() => parseBracketString("[[x]")).toThrow();
  });

  it("supports escaped brackets", () => {
    const { tree, bracketOrder } = parseBracketString("literal \\[not a bracket\\] here");
    expect(bracketOrder).toHaveLength(0);
    expect(tree.children).toHaveLength(1);
    expect(tree.children![0].content).toContain("[not a bracket]");
  });
});

describe("buildPuzzle + reconstruct", () => {
  it("reconstructs the final sentence from top-level answers", () => {
    const p = buildPuzzle({
      id: "t",
      date: "2026-01-01",
      finalSentence: "דוד המלך שלט בירושלים",
      bracketString: "[a] המלך [b] ב[c]",
      specs: [{ answer: "דוד" }, { answer: "שלט" }, { answer: "ירושלים" }],
    });
    expect(reconstructSentence(p.tree)).toBe("דוד המלך שלט בירושלים");
    expect(p.totalBrackets).toBe(3);
  });

  it("ignores nested-bracket answers when reconstructing", () => {
    const p = buildPuzzle({
      id: "t",
      date: "2026-01-01",
      finalSentence: "ירושלים",
      bracketString: "[outer [inner]]",
      specs: [{ answer: "ירושלים" }, { answer: "ישראל" }],
    });
    expect(reconstructSentence(p.tree)).toBe("ירושלים");
    expect(collectBrackets(p.tree)).toHaveLength(2);
  });

  it("rejects mismatched final sentence", () => {
    expect(() =>
      buildPuzzle({
        id: "t",
        date: "2026-01-01",
        finalSentence: "WRONG",
        bracketString: "[a]",
        specs: [{ answer: "right" }],
      }),
    ).toThrow(/mismatch/);
  });
});
