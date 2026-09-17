import type { Metadata } from "next";
import Link from "next/link";
import { formatHebrewDate, monthGrid, monthKey, monthOf, parseMonth, shiftDay, stepMonth } from "@/lib/calendar";
import { loadClues } from "@/lib/clueLibrary";
import { loadAllEvents } from "@/lib/events/load";
import { EVENT_CATEGORY_LABELS } from "@/lib/events/types";
import { todayInIsrael } from "@/lib/puzzle/puzzles";
import { loadLivePuzzles } from "@/lib/puzzleStore";
import { playsByPuzzle } from "@/lib/results";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "לוח בקרה",
  description: "מה קרה, מה מתוכנן ומה חסר — חידות, פותרים, אירועים ומאגר הרמזים.",
  robots: { index: false, follow: false },
};

const BUFFER_DAYS = 30;

export default async function DashboardPage({ searchParams }: { searchParams?: { month?: string } }) {
  const today = todayInIsrael();
  const focus = parseMonth(searchParams?.month) ?? monthOf(today);
  const [puzzles, events, clues] = await Promise.all([loadLivePuzzles(), loadAllEvents(), loadClues().catch(() => [])]);
  const byDate = new Map(puzzles.map((p) => [p.date, p]));
  const days = monthGrid(focus).filter((d) => d.inMonth);
  const plays = await playsByPuzzle(days.map((d) => byDate.get(d.iso)?.id).filter((id): id is string => !!id)).catch((): Awaited<ReturnType<typeof playsByPuzzle>> => ({}));

  // Forward: how far the scheduled buffer reaches, and which of the next 30 days are empty.
  let through = today;
  while (byDate.has(shiftDay(through, 1))) through = shiftDay(through, 1);
  const bufferDays = Math.max(0, Math.round((Date.parse(through) - Date.parse(today)) / 86_400_000));
  const upcomingGaps = Array.from({ length: BUFFER_DAYS }, (_, i) => shiftDay(today, i + 1)).filter((d) => !byDate.has(d));

  // Back: last 7 published days and how they played.
  const recent = puzzles.filter((p) => p.date <= today).slice(-7).reverse();
  const recentPlays = await playsByPuzzle(recent.map((p) => p.id)).catch((): Awaited<ReturnType<typeof playsByPuzzle>> => ({}));

  // Clue library at a glance.
  const answerUses = new Map<string, number>();
  const byType: Record<string, number> = {};
  const byDiff: Record<string, number> = {};
  for (const c of clues) {
    answerUses.set(c.answer, (answerUses.get(c.answer) ?? 0) + 1);
    byType[c.clueType ?? "?"] = (byType[c.clueType ?? "?"] ?? 0) + 1;
    byDiff[c.difficulty ?? "?"] = (byDiff[c.difficulty ?? "?"] ?? 0) + 1;
  }
  const reused = [...answerUses].filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1]).slice(0, 12);

  const heMonth = new Date(focus.year, focus.month - 1, 1).toLocaleDateString("he-IL", { month: "long", year: "numeric" });

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <header className="flex items-baseline justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-hebrew">לוח בקרה</h1>
          <p className="puzzle-mono text-[12px] mt-1 text-muted">
            מתוזמן עד {formatHebrewDate(through)} · {bufferDays} ימי מלאי · {upcomingGaps.length} ימים חסרים ב־{BUFFER_DAYS} הימים הבאים
          </p>
        </div>
        <nav className="puzzle-mono text-[13px] flex items-center gap-3 text-muted">
          <Link href="/admin" className="underline-offset-4 hover:underline">← סטודיו</Link>
          <span className="opacity-40">·</span>
          <Link href="/admin/calendar" className="underline-offset-4 hover:underline">לוח שנה</Link>
          <span className="opacity-40">·</span>
          <Link href="/admin/archive" className="underline-offset-4 hover:underline">ארכיון</Link>
        </nav>
      </header>

      {upcomingGaps.length ? (
        <Card title="קדימה · ימים לכתוב">
          <div className="flex flex-wrap gap-1.5">
            {upcomingGaps.map((d) => (
              <Link key={d} href={`/admin?date=${d}`} className="puzzle-mono text-[11px] px-2 py-0.5 rounded-full border border-red-200 bg-red-50 text-red-800 hover:bg-red-100">
                {d.slice(5)}
              </Link>
            ))}
          </div>
        </Card>
      ) : null}

      <Card title="אחורה · השבוע האחרון">
        {recent.length === 0 ? <p className="puzzle-mono text-[12px] text-muted">עדיין לא פורסמו חידות.</p> : (
          <table className="w-full puzzle-mono text-[12px]">
            <thead className="text-muted"><tr><th className="text-start font-normal">תאריך</th><th className="text-start font-normal">משפט</th><th className="font-normal">פותרים</th><th className="font-normal">ממוצע</th></tr></thead>
            <tbody>
              {recent.map((p) => (
                <tr key={p.id} className="border-t border-line">
                  <td className="py-1 whitespace-nowrap"><Link href={`/admin?id=${p.id}`} className="underline-offset-4 hover:underline">{p.date}</Link></td>
                  <td className="py-1 font-hebrew text-[13px] truncate max-w-[360px]">{p.finalSentence}</td>
                  <td className="py-1 text-center">{recentPlays[p.id]?.plays ?? 0}</td>
                  <td className="py-1 text-center">{recentPlays[p.id]?.avgScore ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card title={`החודש · ${heMonth}`}>
        <div className="flex items-center justify-between puzzle-mono text-[12px] mb-3">
          <Link href={`/admin/dashboard?month=${monthKey(stepMonth(focus, -1))}`} className="underline-offset-4 hover:underline">← חודש קודם</Link>
          <Link href={`/admin/dashboard?month=${monthKey(stepMonth(focus, 1))}`} className="underline-offset-4 hover:underline">חודש הבא →</Link>
        </div>
        <table className="w-full puzzle-mono text-[12px]">
          <thead className="text-muted"><tr><th className="text-start font-normal">יום</th><th className="text-start font-normal">חידה</th><th className="text-start font-normal">אירועים בתאריך</th></tr></thead>
          <tbody>
            {days.map((d) => {
              const p = byDate.get(d.iso);
              const past = d.iso < today;
              const isToday = d.iso === today;
              const evs = events.filter((e) => e.monthDay === d.iso.slice(5));
              const stat = p ? plays[p.id] : undefined;
              const cell = !p
                ? <Link href={`/admin?date=${d.iso}`} className={past ? "text-muted" : "text-red-700 underline-offset-4 hover:underline"}>{past ? "לא היה" : "✕ חסר — לכתוב"}</Link>
                : <Link href={`/admin?id=${p.id}`} className="underline-offset-4 hover:underline">
                    <span className="font-hebrew text-[13px]">{p.finalSentence.slice(0, 48)}{p.finalSentence.length > 48 ? "…" : ""}</span>
                    {stat ? <span className="text-muted"> · {stat.plays} פותרים · ממוצע {stat.avgScore}</span> : past || isToday ? <span className="text-muted"> · 0 פותרים</span> : null}
                  </Link>;
              return (
                <tr key={d.iso} className={"border-t border-line align-top" + (isToday ? " bg-amber-50" : "")}>
                  <td className="py-1.5 whitespace-nowrap">{isToday ? "▶ " : ""}{d.iso.slice(5)}</td>
                  <td className="py-1.5">{cell}</td>
                  <td className="py-1.5 font-hebrew text-[12px] text-muted">
                    {evs.slice(0, 3).map((e) => (
                      <div key={e.id} title={e.descriptionHe}>{e.year ? `${e.year} · ` : ""}{e.titleHe} <span className="puzzle-mono text-[10px] opacity-60">{EVENT_CATEGORY_LABELS[e.category]}</span></div>
                    ))}
                    {evs.length > 3 ? <div className="puzzle-mono text-[10px]">+{evs.length - 3}</div> : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <Card title="מאגר הרמזים">
        <div className="puzzle-mono text-[12px] flex flex-wrap gap-x-4 gap-y-1">
          <span>{clues.length} רמזים</span>
          <span>{answerUses.size} תשובות שונות</span>
          {Object.entries(byType).map(([k, n]) => <span key={k}>{TYPE_HE[k] ?? k}: {n}</span>)}
          <span className="opacity-40">·</span>
          {Object.entries(byDiff).map(([k, n]) => <span key={k}>{DIFF_HE[k] ?? k}: {n}</span>)}
        </div>
        {reused.length ? (
          <div className="mt-3">
            <div className="puzzle-mono text-[11px] text-muted mb-1">תשובות שחזרו על עצמן</div>
            <div className="flex flex-wrap gap-1.5">
              {reused.map(([answer, n]) => (
                <span key={answer} className="puzzle-mono text-[11px] px-2 py-0.5 rounded-full border border-violet-200 bg-violet-50 text-violet-900">{answer} ×{n}</span>
              ))}
            </div>
          </div>
        ) : null}
      </Card>
    </main>
  );
}

const TYPE_HE: Record<string, string> = { definition: "הגדרה", trivia: "טריוויה", "fill-blank": "השלמה", wordplay: "משחק מילים", association: "אסוציאציה", "?": "ללא סוג" };
const DIFF_HE: Record<string, string> = { easy: "קל", medium: "בינוני", hard: "קשה", "?": "ללא קושי" };

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl p-4 bg-white border border-line">
      <div className="puzzle-mono text-[11px] tracking-wider uppercase mb-2 text-muted">{title}</div>
      {children}
    </section>
  );
}
