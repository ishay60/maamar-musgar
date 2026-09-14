import { describe, expect, it } from "vitest";
import {
  shiftDay,
  formatISO,
  monthGrid,
  monthKey,
  monthOf,
  parseMonth,
  stepMonth,
} from "../calendar";

describe("parseMonth", () => {
  it("parses YYYY-MM", () => {
    expect(parseMonth("2026-04")).toEqual({ year: 2026, month: 4 });
    expect(parseMonth("2026-4")).toEqual({ year: 2026, month: 4 });
  });

  it("rejects bad input", () => {
    expect(parseMonth("")).toBeNull();
    expect(parseMonth(undefined)).toBeNull();
    expect(parseMonth("bad")).toBeNull();
    expect(parseMonth("2026-13")).toBeNull();
    expect(parseMonth("2026-00")).toBeNull();
    expect(parseMonth("2026-04-01")).toBeNull();
  });
});

describe("monthOf / monthKey", () => {
  it("round-trips", () => {
    expect(monthOf("2026-04-17")).toEqual({ year: 2026, month: 4 });
    expect(monthKey({ year: 2026, month: 4 })).toBe("2026-04");
    expect(monthKey({ year: 2026, month: 12 })).toBe("2026-12");
  });
});

describe("formatISO", () => {
  it("zero-pads month and day and uses local components", () => {
    expect(formatISO(new Date(2026, 0, 1))).toBe("2026-01-01");
    expect(formatISO(new Date(2026, 11, 31))).toBe("2026-12-31");
  });
});

describe("stepMonth", () => {
  it("steps forward and backward", () => {
    expect(stepMonth({ year: 2026, month: 4 }, 1)).toEqual({ year: 2026, month: 5 });
    expect(stepMonth({ year: 2026, month: 4 }, -1)).toEqual({ year: 2026, month: 3 });
  });

  it("wraps December → January", () => {
    expect(stepMonth({ year: 2026, month: 12 }, 1)).toEqual({ year: 2027, month: 1 });
    expect(stepMonth({ year: 2026, month: 1 }, -1)).toEqual({ year: 2025, month: 12 });
  });
});

describe("monthGrid", () => {
  it("returns 42 cells", () => {
    expect(monthGrid({ year: 2026, month: 4 }).length).toBe(42);
  });

  it("starts on Sunday", () => {
    const grid = monthGrid({ year: 2026, month: 4 });
    // First cell's weekday in local time must be Sunday (0).
    const d = new Date(grid[0].iso + "T00:00:00");
    expect(d.getDay()).toBe(0);
  });

  it("marks in-month cells correctly for a standard month", () => {
    const grid = monthGrid({ year: 2026, month: 4 });
    const inMonth = grid.filter((d) => d.inMonth);
    expect(inMonth.length).toBe(30); // April has 30 days
    expect(inMonth[0].iso).toBe("2026-04-01");
    expect(inMonth[inMonth.length - 1].iso).toBe("2026-04-30");
  });

  it("handles a leap-year February", () => {
    const grid = monthGrid({ year: 2024, month: 2 });
    const inMonth = grid.filter((d) => d.inMonth);
    expect(inMonth.length).toBe(29);
    expect(inMonth[inMonth.length - 1].iso).toBe("2024-02-29");
  });

  it("handles December so January-of-next-year cells appear", () => {
    const grid = monthGrid({ year: 2026, month: 12 });
    const after = grid.filter((d) => !d.inMonth && d.iso > "2026-12-31");
    expect(after.every((d) => d.iso.startsWith("2027-01"))).toBe(true);
  });
});

describe("shiftDay", () => {
  it("crosses month and year boundaries", () => {
    expect(shiftDay("2026-09-30", 1)).toBe("2026-10-01");
    expect(shiftDay("2026-01-01", -1)).toBe("2025-12-31");
  });
});
