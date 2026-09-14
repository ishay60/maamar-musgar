import type { Metadata } from "next";
import { PuzzleBuilder } from "@/components/admin/PuzzleBuilder";
import { findPuzzleByDate, puzzles } from "@/lib/puzzle/puzzles";

export const metadata: Metadata = {
  title: "סטודיו החידות",
  description: "כלי הבנייה לעורכי החידות — פירוק עץ, בדיקות ותצוגה מקדימה.",
  robots: { index: false, follow: false },
};

const pickFirst = (v: string | string[] | undefined): string | undefined =>
  Array.isArray(v) ? v[0] : v;

export default function AdminPage({
  searchParams,
}: {
  searchParams?: { date?: string | string[]; id?: string | string[] };
}) {
  const requestedId = pickFirst(searchParams?.id);
  const requestedDate = pickFirst(searchParams?.date);

  const puzzleById = requestedId
    ? puzzles.find((p) => p.id === requestedId) ?? null
    : null;
  const puzzleByDate =
    !puzzleById && requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate)
      ? findPuzzleByDate(requestedDate)
      : null;
  const initialPuzzle = puzzleById ?? puzzleByDate ?? undefined;

  const initialDate =
    !initialPuzzle && requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate)
      ? requestedDate
      : undefined;

  return <PuzzleBuilder initialDate={initialDate} initialPuzzle={initialPuzzle} />;
}
