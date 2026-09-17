import type { PuzzleNode } from "@/lib/puzzle";
import { clueSummary, collectBrackets, RANK_LABEL_HE } from "@/lib/puzzle";
import type { PuzzleStats } from "@/lib/results";
import { Empty } from "./shared";

/** How players did on this riddle: plays, rank spread, and which brackets hurt. */
export function PuzzleStatsCard({ stats, tree }: { stats: PuzzleStats; tree: PuzzleNode }) {
  if (stats.plays === 0) return <Empty text="עדיין אין פותרים." />;
  const brackets = collectBrackets(tree);
  const pct = (v: number) => `${v}%`;
  return (
    <div className="puzzle-mono text-[12px] space-y-3">
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <span>{stats.plays} פותרים</span>
        <span>ממוצע {stats.avgScore}</span>
        {Object.entries(stats.ranks).map(([rank, n]) => (
          <span key={rank}>{RANK_LABEL_HE[rank as keyof typeof RANK_LABEL_HE] ?? rank}: {Math.round((n / stats.plays) * 100)}%</span>
        ))}
      </div>
      <table className="w-full text-[11px]">
        <thead className="text-muted">
          <tr><th className="text-start font-normal">סוגר</th><th className="font-normal">טעו</th><th className="font-normal">הציצו</th><th className="font-normal">חשפו</th></tr>
        </thead>
        <tbody>
          {brackets.map((n) => {
            const s = stats.byNode[n.id] ?? { wrong: 0, peek: 0, reveal: 0 };
            const hot = s.wrong + s.reveal >= 50;
            return (
              <tr key={n.id} className={hot ? "text-red-800" : ""}>
                <td className="py-0.5 font-hebrew text-[12px] truncate max-w-[180px]" title={clueSummary(n)}>{clueSummary(n)} = {n.answer}</td>
                <td className="text-center">{pct(s.wrong)}</td>
                <td className="text-center">{pct(s.peek)}</td>
                <td className="text-center">{pct(s.reveal)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {/* ponytail: node ids shift if a bracket is inserted after publication; stats then mis-align. Key by clue text if that bites. */}
    </div>
  );
}
