import { NextRequest, NextResponse } from "next/server";
import { SESSION_MAX_AGE, issueSession } from "@/lib/adminAccess";
import { db } from "@/lib/db";
import { DEVICE_COOKIE, PLAYER_COOKIE, isUuid } from "@/lib/player";
import { mergePlayers, playerByEmail } from "@/lib/results";

export const dynamic = "force-dynamic";

/**
 * Player sign-in step 2: /auth/callback posts the access token from the magic
 * link's #fragment. Verify it with Supabase, find/create the player, absorb the
 * history of every device involved, and set our own session cookie.
 */
export async function POST(request: NextRequest) {
  const client = db();
  if (!client) return NextResponse.json({ ok: false }, { status: 404 });
  const body = await request.json().catch(() => null);
  const token = typeof body?.accessToken === "string" ? body.accessToken : "";
  if (!token) return NextResponse.json({ ok: false }, { status: 400 });
  const { data, error } = await client.auth.getUser(token);
  const email = data?.user?.email?.toLowerCase();
  if (error || !email) return NextResponse.json({ ok: false }, { status: 401 });

  try {
    const player = await playerByEmail(email);
    const claimed: unknown[] = Array.isArray(body.devices) ? body.devices.slice(0, 5) : [];
    const devices = new Set([request.cookies.get(DEVICE_COOKIE)?.value, ...claimed].filter(isUuid));
    for (const device of devices) await mergePlayers(device, player.id);
    const res = NextResponse.json({ ok: true });
    res.cookies.set(PLAYER_COOKIE, issueSession(player.id), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });
    return res;
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "sign-in failed" }, { status: 502 });
  }
}
