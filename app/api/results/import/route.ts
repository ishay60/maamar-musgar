import { NextRequest, NextResponse } from "next/server";
import { readSession } from "@/lib/adminAccess";
import { db } from "@/lib/db";
import { PLAYER_COOKIE } from "@/lib/player";
import { todayInIsrael } from "@/lib/puzzle/puzzles";
import { importHistory } from "@/lib/results";
import type { ImportedResult } from "@/lib/results";

export const dynamic = "force-dynamic";

/** Upload this browser's local-only completions to the signed-in player's account. */
export async function POST(request: NextRequest) {
  if (!db()) return NextResponse.json({ ok: false }, { status: 404 });
  const playerId = readSession(request.cookies.get(PLAYER_COOKIE)?.value);
  if (!playerId) return NextResponse.json({ ok: false }, { status: 401 });
  const body = await request.json().catch(() => null);
  const entries: ImportedResult[] = (Array.isArray(body?.entries) ? body.entries : [])
    .slice(0, 1000)
    .filter((e: unknown): e is ImportedResult => {
      const r = e as ImportedResult;
      return !!r && typeof r.date === "string" && typeof r.rank === "string" && typeof r.score === "number";
    });
  try {
    const added = await importHistory(playerId, entries, todayInIsrael());
    return NextResponse.json({ ok: true, added });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "import failed" }, { status: 502 });
  }
}
