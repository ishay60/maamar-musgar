import type { Metadata } from "next";
import Link from "next/link";
import { puzzles } from "@/lib/puzzle/puzzles";

export const metadata: Metadata = {
  title: "ארכיון החידות",
  description: "כל חידות מאמר מוסגר שפורסמו עד כה.",
  robots: { index: false, follow: false },
};

export default function ArchivePage() {
  const sorted = [...puzzles].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header className="flex items-baseline justify-between gap-3 flex-wrap mb-6">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ fontFamily: '"David Libre", serif' }}
          >
            ארכיון החידות
          </h1>
          <p className="puzzle-mono text-[12px] mt-1" style={{ color: "#6b6356" }}>
            Phase 3 · Archive · {puzzles.length} puzzles
          </p>
        </div>
        <nav
          className="puzzle-mono text-[13px] flex items-center gap-3"
          style={{ color: "#6b6356" }}
        >
          <Link href="/admin" className="underline-offset-4 hover:underline">
            ← סטודיו
          </Link>
          <span style={{ opacity: 0.4 }}>·</span>
          <Link href="/admin/calendar" className="underline-offset-4 hover:underline">
            לוח שנה
          </Link>
          <span style={{ opacity: 0.4 }}>·</span>
          <Link href="/" className="underline-offset-4 hover:underline">
            משחק
          </Link>
        </nav>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sorted.map((p) => (
          <article
            key={p.id}
            className="rounded-xl p-4 hover:shadow-md transition-shadow"
            style={{ backgroundColor: "#ffffff", border: "1px solid #e7e0d0" }}
          >
            <div
              className="puzzle-mono text-[11px] flex items-center justify-between"
              style={{ color: "#6b6356" }}
            >
              <span>{p.date}</span>
              <span
                className="px-1.5 rounded-sm"
                style={{ backgroundColor: "#ede9fe", color: "#4c1d95" }}
              >
                {p.totalBrackets} סוגרים
              </span>
            </div>
            <h2
              className="text-lg mt-2 leading-snug"
              style={{ fontFamily: '"David Libre", serif' }}
            >
              {p.finalSentence}
            </h2>
            {p.historicalContext ? (
              <p
                className="text-[13px] mt-2 leading-snug line-clamp-3"
                style={{ color: "#4b5563", fontFamily: '"David Libre", serif' }}
              >
                {p.historicalContext}
              </p>
            ) : null}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex gap-1 flex-wrap">
                {(p.tags ?? []).map((t) => (
                  <span
                    key={t}
                    className="puzzle-mono text-[10px] px-1.5 py-0.5 rounded-sm"
                    style={{ backgroundColor: "#f3f4f6", color: "#374151" }}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin?id=${encodeURIComponent(p.id)}`}
                  className="puzzle-mono text-[12px]"
                  style={{ color: "#4c1d95" }}
                  aria-label={`ערוך חידה מ-${p.date}`}
                >
                  [edit] ✎
                </Link>
                <Link
                  href={`/?date=${p.date}`}
                  className="puzzle-mono text-[12px]"
                  style={{ color: "#171412" }}
                >
                  [play] →
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
