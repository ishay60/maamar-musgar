"use client";

import { RANK_LABEL_HE } from "@/lib/puzzle";
import type { StreakData } from "@/lib/streak";

/** Player stats from the completion map, plus magic-link sign-in / sign-out. */
export function StatsDialog({
  data,
  email,
  loginFlag,
  back,
  onClose,
}: {
  data: StreakData;
  email: string | null;
  loginFlag: string | null;
  back: string;
  onClose: () => void;
}) {
  const results = Object.values(data.completed);
  const played = results.length;
  const avg = played ? Math.round(results.reduce((s, r) => s + r.score, 0) / played) : 0;
  const best = played ? Math.max(...results.map((r) => r.score)) : 0;
  const ranks = results.reduce<Record<string, number>>((acc, r) => ({ ...acc, [r.rank]: (acc[r.rank] ?? 0) + 1 }), {});
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(23,20,18,0.45)" }} onClick={onClose} role="dialog" aria-modal="true" aria-label="הסטטיסטיקות שלי">
      <div className="w-full max-w-sm rounded-xl p-5" style={{ backgroundColor: "#fbfaf4", border: "1px solid #e7e0d0" }} onClick={(e) => e.stopPropagation()}>
        <div className="puzzle-mono text-[12px] tracking-wider uppercase" style={{ color: "#6b6356" }}>הסטטיסטיקות שלי</div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <Stat label="שוחקו" value={played} />
          <Stat label="רצף" value={`🔥 ${data.current}`} />
          <Stat label="שיא" value={`★ ${data.longest}`} />
          <Stat label="ממוצע" value={avg} />
          <Stat label="הכי טוב" value={best} />
          <Stat label="ללא טעויות" value={ranks[RANK_LABEL_HE.kingmaker] ?? 0} />
        </div>
        {Object.keys(ranks).length ? (
          <div className="mt-3 puzzle-mono text-[11px] flex flex-wrap gap-x-3 gap-y-1" style={{ color: "#6b6356" }}>
            {Object.entries(ranks).map(([rank, n]) => <span key={rank}>{rank}: {n}</span>)}
          </div>
        ) : null}
        <div className="mt-4 pt-4" style={{ borderTop: "1px solid #e7e0d0" }}>
          {email ? (
            <form method="post" action="/api/auth/logout" className="flex items-center justify-between gap-2 puzzle-mono text-[12px]">
              <span dir="ltr" className="truncate">{email}</span>
              <button type="submit" className="underline underline-offset-4 shrink-0">יציאה</button>
            </form>
          ) : (
            <form method="post" action="/api/auth/login" className="flex flex-col gap-2">
              <div className="text-[13px]" style={{ fontFamily: '"David Libre", serif' }}>
                הירשמו כדי לשמור את הרצף והסטטיסטיקות בכל המכשירים.
              </div>
              {loginFlag === "sent" ? <p className="puzzle-mono text-[12px] text-emerald-700">שלחנו קישור כניסה למייל.</p> : null}
              {loginFlag === "error" ? <p className="puzzle-mono text-[12px] text-red-700">הכניסה נכשלה. נסו שוב.</p> : null}
              <input type="hidden" name="back" value={back} />
              <input type="email" name="email" required dir="ltr" placeholder="email" className="rounded-md px-3 py-2 text-[14px]" style={{ border: "1px solid #e7e0d0" }} />
              <button type="submit" className="rounded-md px-3 py-2 puzzle-mono text-[12px]" style={{ backgroundColor: "#171412", color: "#fbfaf4" }}>[שלחו לי קישור כניסה]</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md px-2 py-2" style={{ backgroundColor: "#ffffff", border: "1px solid #e7e0d0" }}>
      <div className="text-xl font-bold tabular-nums" style={{ fontFamily: '"IBM Plex Mono", monospace' }}>{value}</div>
      <div className="puzzle-mono text-[10px]" style={{ color: "#6b6356" }}>{label}</div>
    </div>
  );
}
