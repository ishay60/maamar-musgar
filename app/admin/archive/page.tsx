import type { Metadata } from "next";
import Link from "next/link";
import { loadLivePuzzles } from "@/lib/puzzleStore";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ארכיון החידות",
  description: "כל חידות מאמר מוסגר שפורסמו עד כה.",
  robots: { index: false, follow: false },
};

export default async function ArchivePage() {
  const puzzles = await loadLivePuzzles();
  const sorted = [...puzzles].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header className="flex items-baseline justify-between gap-3 flex-wrap mb-6">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight font-hebrew"
          >
            ארכיון החידות
          </h1>
          <p className="puzzle-mono text-[12px] mt-1 text-muted">
            {puzzles.length} חידות
          </p>
        </div>
        <nav
          className="puzzle-mono text-[13px] flex items-center gap-3 text-muted"
        >
          <Link href="/admin" className="underline-offset-4 hover:underline">
            ← סטודיו
          </Link>
          <span className="opacity-40">·</span>
          <Link href="/admin/calendar" className="underline-offset-4 hover:underline">
            לוח שנה
          </Link>
          <span className="opacity-40">·</span>
          <Link href="/" className="underline-offset-4 hover:underline">
            משחק
          </Link>
        </nav>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sorted.map((p) => (
          <article
            key={p.id}
            className="rounded-xl p-4 hover:shadow-md transition-shadow bg-white border border-line"
          >
            <div
              className="puzzle-mono text-[11px] flex items-center justify-between text-muted"
            >
              <span>{p.date}</span>
              <span
                className="px-1.5 rounded-sm bg-violet-100 text-violet-900"
              >
                {p.totalBrackets} סוגרים
              </span>
            </div>
            <h2
              className="text-lg mt-2 leading-snug font-hebrew"
            >
              {p.finalSentence}
            </h2>
            {p.historicalContext ? (
              <p
                className="text-[13px] mt-2 leading-snug line-clamp-3 text-gray-600 font-hebrew"
              >
                {p.historicalContext}
              </p>
            ) : null}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex gap-1 flex-wrap">
                {(p.tags ?? []).map((t) => (
                  <span
                    key={t}
                    className="puzzle-mono text-[10px] px-1.5 py-0.5 rounded-sm bg-gray-100 text-gray-700"
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin?id=${encodeURIComponent(p.id)}`}
                  className="puzzle-mono text-[12px] text-violet-900"
                  aria-label={`ערוך חידה מ-${p.date}`}
                >
                  [עריכה] ✎
                </Link>
                <Link
                  href={`/?date=${p.date}`}
                  className="puzzle-mono text-[12px] text-ink"
                >
                  [משחק] →
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
