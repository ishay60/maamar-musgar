import type { Metadata } from "next";
import { PuzzleBuilder } from "@/components/admin/PuzzleBuilder";
import { todayInIsrael } from "@/lib/puzzle/puzzles";
import { loadLivePuzzles } from "@/lib/puzzleStore";
import { puzzleStats } from "@/lib/results";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "סטודיו החידות",
  description: "כלי הבנייה לעורכי החידות — פירוק עץ, בדיקות ותצוגה מקדימה.",
  robots: { index: false, follow: false },
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: { date?: string; id?: string };
}) {
  const requestedId = searchParams?.id;
  // No date in the URL means "today": open today's puzzle if it exists.
  const requestedDate = searchParams?.date ?? todayInIsrael();
  const puzzles = await loadLivePuzzles();

  const puzzleById = requestedId
    ? puzzles.find((p) => p.id === requestedId) ?? null
    : null;
  const puzzleByDate =
    !puzzleById && requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate)
      ? puzzles.find((p) => p.date === requestedDate) ?? null
      : null;
  const initialPuzzle = puzzleById ?? puzzleByDate ?? undefined;

  const initialDate =
    !initialPuzzle && requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate)
      ? requestedDate
      : undefined;

  const stats = initialPuzzle ? await puzzleStats(initialPuzzle.id).catch(() => null) : null;
  return <PuzzleBuilder initialDate={initialDate} initialPuzzle={initialPuzzle} stats={stats} />;
}
