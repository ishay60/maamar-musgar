import { NextRequest, NextResponse } from "next/server";
import { readSession } from "@/lib/adminAccess";
import { db } from "@/lib/db";
import { PLAYER_COOKIE, isUuid } from "@/lib/player";
import { todayInIsrael } from "@/lib/puzzle/puzzles";
import { saveResult } from "@/lib/results";

export const dynamic = "force-dynamic";

const RANKS = ["tourist", "commuter", "mayor", "kingmaker"];
const ids = (v: unknown) => (Array.isArray(v) ? v.filter((s): s is string => typeof s === "string" && s.length < 16).slice(0, 200) : []);

/** Body is trusted as far as the design allows: uniqueness per player per puzzle, clipped values. */
export async function POST(request: NextRequest) {
  const client = db();
  if (!client) return NextResponse.json({ ok: false }, { status: 404 });
  const signedIn = readSession(request.cookies.get(PLAYER_COOKIE)?.value);
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ ok: false }, { status: 400 });
  const playerId = signedIn ?? body.deviceId;
  if (!isUuid(playerId) || typeof body.puzzleId !== "string" || !RANKS.includes(body.rank)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const { data: puzzle } = await client.from("puzzles").select("date,max_score").eq("id", body.puzzleId).eq("status", "scheduled").maybeSingle();
  const today = todayInIsrael();
  if (!puzzle || puzzle.date > today) return NextResponse.json({ ok: false }, { status: 404 });
  const clip = (v: unknown, max: number) => Math.min(max, Math.max(0, Math.round(Number(v) || 0)));
  try {
    const summary = await saveResult({
      puzzleId: body.puzzleId,
      playerId,
      score: clip(body.score, puzzle.max_score ?? 100),
      rank: body.rank,
      wrongGuesses: clip(body.wrongGuesses, 999),
      wrongByNode: typeof body.wrongByNode === "object" && body.wrongByNode ? body.wrongByNode : {},
      peeks: ids(body.peeks),
      reveals: ids(body.reveals),
      solveOrder: ids(body.solveOrder),
      durationSeconds: body.durationSeconds == null ? null : clip(body.durationSeconds, 86_400),
      live: puzzle.date === today,
    });
    return NextResponse.json({ ok: true, ...summary });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "save failed" }, { status: 502 });
  }
}
