import type { Metadata } from "next";
import { GameContainer } from "@/components/GameContainer";
import { isAdminEnabled } from "@/lib/adminAccess";
import { publishedPuzzles, todayInIsrael } from "@/lib/puzzle/puzzles";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "חידת היום",
  description:
    "מאמר מוסגר — פענחו את המשפט החבוי, סוגר אחר סוגר, מהעלה הפנימי החוצה.",
  openGraph: {
    title: "מאמר מוסגר — חידת היום",
    description:
      "פענחו את המשפט החבוי, סוגר אחר סוגר, מהעלה הפנימי החוצה.",
  },
};

export default function HomePage({
  searchParams,
}: {
  searchParams: { date?: string; preview?: string };
}) {
  const today = todayInIsrael();
  const available = publishedPuzzles(today);
  const puzzle =
    available.find((p) => p.date === searchParams.date) ?? available[available.length - 1];
  if (!puzzle) {
    return <main className="p-8 text-center">אין עדיין חידה. חזרו מחר.</main>;
  }
  const studioEnabled = isAdminEnabled();
  return (
    <GameContainer
      puzzle={puzzle}
      dates={available.map((p) => p.date)}
      today={today}
      studioEnabled={studioEnabled}
      previewEnd={studioEnabled && searchParams.preview === "end"}
    />
  );
}
