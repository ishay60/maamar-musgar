import { describe, expect, it } from "vitest";
import { emptyAnswerRow, realignRows } from "../clueRows";

const row = (clue: string, answer: string) => ({ ...emptyAnswerRow(clue), answer });

describe("realignRows", () => {
  it("keeps answers with their clue when a bracket is inserted before them", () => {
    const prev = [row("a", "1"), row("b", "2")];
    const next = realignRows(prev, ["a", "new", "b"]);
    expect(next.map((r) => r.answer)).toEqual(["1", "", "2"]);
    expect(next[1].clue).toBe("new");
  });
  it("follows a clue being edited by reusing the orphaned row", () => {
    const next = realignRows([row("a", "1"), row("b", "2")], ["a", "bx"]);
    expect(next.map((r) => r.answer)).toEqual(["1", "2"]);
    expect(next[1].clue).toBe("bx");
  });
  it("drops rows whose bracket was removed", () => {
    expect(realignRows([row("a", "1"), row("b", "2")], ["b"]).map((r) => r.answer)).toEqual(["2"]);
  });
});
