import type { Metadata } from "next";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { GameContainer } from "@/components/GameContainer";
import { isAdminEnabled, readSession } from "@/lib/adminAccess";
import { PLAYER_COOKIE } from "@/lib/player";
import { playerEmail, playerHistory } from "@/lib/results";
import { todayInIsrael } from "@/lib/puzzle/puzzles";
import { loadPublishedPuzzles } from "@/lib/puzzleStore";

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

export default async function HomePage({
  searchParams,
}: {
  searchParams: { date?: string };
}) {
  const today = todayInIsrael();
  const playerId = readSession(cookies().get(PLAYER_COOKIE)?.value);
  const [available, account] = await Promise.all([
    loadPublishedPuzzles(today),
    playerId ? loadAccount(playerId, today) : null,
  ]);
  const puzzle =
    available.find((p) => p.date === searchParams.date) ?? available[available.length - 1];
  if (!puzzle) {
    return <main className="p-8 text-center">אין עדיין חידה. חזרו מחר.</main>;
  }
  return (
    <Suspense>
      <GameContainer
        key={puzzle.id}
        puzzle={puzzle}
        dates={available.map((p) => p.date)}
        today={today}
        studioEnabled={isAdminEnabled()}
        account={account}
      />
    </Suspense>
  );
}

async function loadAccount(playerId: string, today: string) {
  try {
    const [email, history] = await Promise.all([playerEmail(playerId), playerHistory(playerId, today)]);
    return email ? { email, history } : null;
  } catch {
    return null; // a broken history read must never take the game down
  }
}
