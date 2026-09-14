import type { Metadata } from "next";
import { PuzzleBuilder } from "@/components/admin/PuzzleBuilder";
import { loadLivePuzzles } from "@/lib/puzzleStore";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "סטודיו החידות",
  description: "כלי הבנייה לעורכי החידות — פירוק עץ, בדיקות ותצוגה מקדימה.",
  robots: { index: false, follow: false },
};

const pickFirst = (v: string | string[] | undefined): string | undefined =>
  Array.isArray(v) ? v[0] : v;

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: { date?: string | string[]; id?: string | string[] };
}) {
  const requestedId = pickFirst(searchParams?.id);
  const requestedDate = pickFirst(searchParams?.date);
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

  return <PuzzleBuilder initialDate={initialDate} initialPuzzle={initialPuzzle} />;
}
