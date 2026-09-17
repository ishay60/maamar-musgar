"use client";

import { useState } from "react";
import { monthGrid, monthKey, monthOf, stepMonth } from "@/lib/calendar";

/**
 * Month grid of puzzles: filled = solved, dashed = available, grey = not yet.
 * Mirrors bracket.city's calendar; reuses the studio's month helpers.
 */
export function CalendarPopover({
  dates,
  completed,
  current,
  today,
  streak,
  onPick,
  onClose,
}: {
  dates: string[];
  completed: Record<string, unknown>;
  current: string;
  today: string;
  streak: number;
  onPick: (iso: string) => void;
  onClose: () => void;
}) {
  const [focus, setFocus] = useState(monthOf(current));
  const available = new Set(dates);
  const first = dates[0] ?? today;
  const title = new Date(focus.year, focus.month - 1, 1).toLocaleDateString("he-IL", { month: "long", year: "numeric" });
  const canPrev = monthKey(focus) > first.slice(0, 7);
  const canNext = monthKey(focus) < today.slice(0, 7);
  return (
    <div className="fixed inset-0 z-50" onClick={onClose} role="dialog" aria-modal="true" aria-label="לוח חידות">
      <div
        className="absolute left-1/2 -translate-x-1/2 top-16 w-[min(92vw,360px)] rounded-xl p-4 puzzle-mono"
        style={{ backgroundColor: "#fbfaf4", border: "1px solid #e7e0d0", boxShadow: "0 12px 30px -12px rgba(0,0,0,0.3)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between text-[13px]">
          <button type="button" disabled={!canPrev} onClick={() => setFocus(stepMonth(focus, -1))} className="px-2 disabled:opacity-25" aria-label="חודש קודם">›</button>
          <div className="font-semibold">{title}</div>
          <button type="button" disabled={!canNext} onClick={() => setFocus(stepMonth(focus, 1))} className="px-2 disabled:opacity-25" aria-label="חודש הבא">‹</button>
        </div>
        <div className="text-center text-[11px] mt-1" style={{ color: "#6b6356" }}>🔥 רצף: {streak}</div>
        <div className="grid grid-cols-7 gap-1 mt-3 text-center text-[11px]" style={{ color: "#6b6356" }}>
          {["א", "ב", "ג", "ד", "ה", "ו", "ש"].map((d) => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1 mt-1">
          {monthGrid(focus).map((d) => {
            if (!d.inMonth) return <div key={d.iso} />;
            const done = d.iso in completed;
            const open = available.has(d.iso);
            const style = done
              ? { backgroundColor: "#fde7d3", border: "1.5px solid #f0a06a" }
              : open
                ? { border: "1.5px dashed #f0a06a" }
                : { color: "#c4bcae" };
            return (
              <button
                key={d.iso}
                type="button"
                disabled={!open}
                onClick={() => { onPick(d.iso); onClose(); }}
                className="relative aspect-square rounded-full text-[12px] flex items-center justify-center disabled:cursor-default"
                style={style}
                aria-label={`${d.iso}${done ? " · נפתר" : open ? " · זמין" : ""}`}
                aria-current={d.iso === current ? "date" : undefined}
              >
                {d.day}
                {d.iso === current ? <span className="absolute bottom-0.5 w-1 h-1 rounded-full" style={{ backgroundColor: "#171412" }} /> : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
