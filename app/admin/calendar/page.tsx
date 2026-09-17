import type { Metadata } from "next";
import Link from "next/link";
import { todayInIsrael } from "@/lib/puzzle/puzzles";
import { loadLivePuzzles } from "@/lib/puzzleStore";

export const dynamic = "force-dynamic";
import {
  monthGrid,
  monthKey,
  monthOf,
  parseMonth,
  stepMonth,
} from "@/lib/calendar";

export const metadata: Metadata = {
  title: "לוח שנה",
  description: "לוח חודשי של חידות מתוזמנות ושל ימים חסרים.",
  robots: { index: false, follow: false },
};

export default async function CalendarPage({
  searchParams,
}: {
  searchParams?: { month?: string };
}) {
  const puzzles = await loadLivePuzzles();
  const byDate = new Map(puzzles.map((p) => [p.date, p]));
  const today = todayInIsrael();
  const focus = parseMonth(searchParams?.month) ?? monthOf(today);
  const { year, month } = focus;
  const days = monthGrid(focus);
  const heMonth = new Date(year, month - 1, 1).toLocaleDateString("he-IL", {
    month: "long",
    year: "numeric",
  });
  const prevMonth = stepMonth(focus, -1);
  const nextMonth = stepMonth(focus, 1);

  const inMonth = puzzles.filter((p) => p.date.startsWith(monthKey(focus)));
  const published = inMonth.length;
  const gaps = days.filter((d) => d.inMonth && !byDate.has(d.iso)).length;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header className="flex items-baseline justify-between gap-3 flex-wrap mb-6">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight font-hebrew"
          >
            לוח השנה של החידות
          </h1>
          <p className="puzzle-mono text-[12px] mt-1 text-muted">
            {published} פורסמו · {gaps} חסרים החודש
          </p>
        </div>
        <nav
          className="puzzle-mono text-[13px] flex items-center gap-3 text-muted"
        >
          <Link href="/admin" className="underline-offset-4 hover:underline">
            ← סטודיו
          </Link>
          <span className="opacity-40">·</span>
          <Link href="/admin/dashboard" className="underline-offset-4 hover:underline">
            לוח בקרה
          </Link>
          <span className="opacity-40">·</span>
          <Link href="/admin/archive" className="underline-offset-4 hover:underline">
            ארכיון
          </Link>
          <span className="opacity-40">·</span>
          <Link href="/" className="underline-offset-4 hover:underline">
            משחק
          </Link>
        </nav>
      </header>

      <div className="flex items-center justify-between gap-3 mb-4">
        <Link
          href={`/admin/calendar?month=${monthKey(prevMonth)}`}
          className="puzzle-mono text-[12px] px-3 py-1 rounded-md border border-line text-ink"
        >
          ← חודש קודם
        </Link>
        <div
          className="text-lg font-hebrew"
          aria-live="polite"
        >
          {heMonth}
        </div>
        <Link
          href={`/admin/calendar?month=${monthKey(nextMonth)}`}
          className="puzzle-mono text-[12px] px-3 py-1 rounded-md border border-line text-ink"
        >
          חודש הבא →
        </Link>
      </div>

      <div
        className="grid grid-cols-7 gap-1 text-center puzzle-mono text-[11px] mb-1 text-muted"
        aria-hidden
      >
        {["א", "ב", "ג", "ד", "ה", "ו", "ש"].map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div
        className="grid grid-cols-7 gap-1"
        role="grid"
        aria-label={`לוח חידות לחודש ${heMonth}`}
      >
        {days.map((d) => {
          const puzzle = byDate.get(d.iso);
          const status: CellStatus = !d.inMonth
            ? "outside"
            : puzzle
            ? "published"
            : "gap";
          return (
            <DayCell
              key={d.iso}
              iso={d.iso}
              day={d.day}
              status={status}
              isToday={d.iso === today}
              puzzleTitle={puzzle?.finalSentence}
              brackets={puzzle?.totalBrackets}
            />
          );
        })}
      </div>

      <Legend />
    </main>
  );
}

type CellStatus = "outside" | "published" | "gap";

function DayCell({
  iso,
  day,
  status,
  isToday,
  puzzleTitle,
  brackets,
}: {
  iso: string;
  day: number;
  status: CellStatus;
  isToday: boolean;
  puzzleTitle?: string;
  brackets?: number;
}) {
  const base =
    "relative rounded-md min-h-[78px] p-2 text-start border transition-colors" +
    (isToday ? " ring-2 ring-[#171412] ring-offset-1" : "");
  if (status === "outside") {
    return (
      <div
        className={base + " border-gray-100 bg-paper opacity-35"}
        aria-hidden
      >
        <div className="puzzle-mono text-[11px] text-gray-400">
          {day}
        </div>
      </div>
    );
  }
  if (status === "published") {
    return (
      <Link
        href={`/admin?date=${iso}`}
        className={base + " border-emerald-300 bg-emerald-50 hover:shadow-sm"}
        role="gridcell"
        aria-label={`${iso} — פורסם, לחצו לעריכה: ${puzzleTitle ?? ""}`}
      >
        <div className="flex items-center justify-between">
          <span
            className="puzzle-mono text-[10px] px-1 rounded-sm bg-emerald-600 text-emerald-50"
          >
            ✓
          </span>
          <span className="puzzle-mono text-[12px] text-emerald-700">
            {day}
          </span>
        </div>
        {puzzleTitle ? (
          <div
            className="text-[11px] mt-1 line-clamp-2 leading-tight text-emerald-800 font-hebrew"
          >
            {puzzleTitle}
          </div>
        ) : null}
        {brackets != null ? (
          <div className="puzzle-mono text-[10px] mt-1 text-emerald-700 opacity-70">
            {brackets} סוגרים
          </div>
        ) : null}
      </Link>
    );
  }
  return (
    <Link
      href={`/admin?date=${iso}`}
      className={base + " border-line bg-white hover:border-indigo-200"}
      role="gridcell"
      aria-label={`${iso} — אין חידה, לחצו להוספה`}
    >
      <div className="flex items-center justify-between">
        <span
          className="puzzle-mono text-[10px] text-red-700"
        >
          ✕ חסר
        </span>
        <span className="puzzle-mono text-[12px] text-muted">
          {day}
        </span>
      </div>
      <div
        className="text-[11px] mt-1 text-gray-400 font-hebrew"
      >
        + הוספת חידה
      </div>
    </Link>
  );
}

function Legend() {
  return (
    <div
      className="mt-4 puzzle-mono text-[11px] flex items-center gap-4 flex-wrap text-muted"
    >
      <span className="inline-flex items-center gap-1">
        <span
          className="inline-block w-3 h-3 rounded-sm bg-emerald-50 border border-emerald-300"
        />
        פורסם
      </span>
      <span className="inline-flex items-center gap-1">
        <span
          className="inline-block w-3 h-3 rounded-sm bg-white border border-line"
        />
        חסר / להוספה
      </span>
    </div>
  );
}

