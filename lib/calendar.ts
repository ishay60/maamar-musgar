/**
 * Pure date helpers for the admin calendar — no React, no locale dependencies
 * beyond the caller's choice. Extracted from app/admin/calendar/page.tsx so
 * month-boundary logic can be unit-tested in isolation.
 */

export interface YearMonth {
  year: number;
  month: number; // 1-12
}

export interface Day {
  iso: string;
  day: number;
  inMonth: boolean;
}

export function parseMonth(s: string | undefined): YearMonth | null {
  if (!s) return null;
  const m = /^(\d{4})-(\d{1,2})$/.exec(s);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  if (month < 1 || month > 12) return null;
  return { year, month };
}

export function monthOf(iso: string): YearMonth {
  const [y, m] = iso.split("-");
  return { year: Number(y), month: Number(m) };
}

export function monthKey({ year, month }: YearMonth): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function formatISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** "14 במאי 1948" for an ISO date. */
export function formatHebrewDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("he-IL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** ISO date shifted by `delta` days. */
export function shiftDay(iso: string, delta: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + delta);
  return formatISO(d);
}

export function stepMonth({ year, month }: YearMonth, delta: number): YearMonth {
  const d = new Date(year, month - 1 + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

/**
 * 6-row (42-cell) grid of days starting on Sunday. Cells outside the focus
 * month are still filled in so the grid is always a complete rectangle.
 */
export function monthGrid({ year, month }: YearMonth): Day[] {
  const first = new Date(year, month - 1, 1);
  const startDow = first.getDay();
  const out: Day[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(year, month - 1, i - startDow + 1);
    out.push({
      iso: formatISO(d),
      day: d.getDate(),
      inMonth: d.getMonth() === month - 1,
    });
  }
  return out;
}
