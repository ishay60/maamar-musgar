import { NextRequest, NextResponse } from "next/server";
import { readSession } from "@/lib/adminAccess";
import { db } from "@/lib/db";
import { PLAYER_COOKIE } from "@/lib/player";
import { parseProgress } from "@/lib/progress";
import { saveProgress } from "@/lib/results";

export const dynamic = "force-dynamic";

/** Save a signed-in player's game for one puzzle. Anonymous players keep progress in localStorage only. */
export async function PUT(request: NextRequest) {
  if (!db()) return NextResponse.json({ ok: false }, { status: 404 });
  const playerId = readSession(request.cookies.get(PLAYER_COOKIE)?.value);
  if (!playerId) return NextResponse.json({ ok: false }, { status: 401 });
  const raw = await request.text();
  if (raw.length > 20_000) return NextResponse.json({ ok: false }, { status: 413 });
  const body = (() => {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  })();
  const state = parseProgress(body?.state);
  if (typeof body?.puzzleId !== "string" || !state) return NextResponse.json({ ok: false }, { status: 400 });
  try {
    await saveProgress(playerId, body.puzzleId, state);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "save failed" }, { status: 502 });
  }
}
