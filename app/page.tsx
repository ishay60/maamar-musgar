import type { Metadata } from "next";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { GameContainer } from "@/components/GameContainer";
import { ADMIN_COOKIE, isAdminAuthed, isAdminEnabled, readSession } from "@/lib/adminAccess";
import { PLAYER_COOKIE } from "@/lib/player";
import { loadProgress, playerEmail, playerHistory } from "@/lib/results";
import { ONBOARDING_PUZZLE } from "@/lib/puzzle/onboarding";
import { todayInIsrael } from "@/lib/puzzle/puzzles";
import { loadPublishedPuzzles, loadScheduledPuzzles } from "@/lib/puzzleStore";

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
  searchParams: { date?: string; tutorial?: string };
}) {
  const today = todayInIsrael();
  const jar = cookies();
  const playerId = readSession(jar.get(PLAYER_COOKIE)?.value);
  // Signed-in editors (and the local workspace) can play scheduled puzzles ahead of their date.
  const editor = isAdminEnabled() && isAdminAuthed(jar.get(ADMIN_COOKIE)?.value);
  const [available, account] = await Promise.all([
    editor ? loadScheduledPuzzles() : loadPublishedPuzzles(today),
    playerId ? loadAccount(playerId, today) : null,
  ]);
  const dates = available.map((p) => p.date);

  if (searchParams.tutorial != null) {
    return (
      <Suspense>
        <GameContainer
          key="onboarding"
          puzzle={ONBOARDING_PUZZLE}
          dates={dates}
          today={today}
          studioEnabled={isAdminEnabled()}
          account={account}
          mode="tutorial"
        />
      </Suspense>
    );
  }

  const current = available.filter((p) => p.date <= today);
  const puzzle =
    available.find((p) => p.date === searchParams.date) ?? current[current.length - 1] ?? available[0];
  if (!puzzle) {
    return <main className="p-8 text-center">אין עדיין חידה. חזרו מחר.</main>;
  }
  const preview = puzzle.date > today;
  const saved = account && playerId && !preview ? await loadProgress(playerId, puzzle.id).catch(() => null) : null;
  return (
    <Suspense>
      <GameContainer
        key={puzzle.id}
        puzzle={puzzle}
        dates={dates}
        today={today}
        studioEnabled={isAdminEnabled()}
        account={account}
        saved={saved}
        mode={preview ? "preview" : "live"}
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
