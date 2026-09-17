import { NextRequest, NextResponse } from "next/server";
import { SESSION_MAX_AGE, issueSession } from "@/lib/adminAccess";
import { db } from "@/lib/db";
import { DEVICE_COOKIE, PLAYER_COOKIE, isUuid } from "@/lib/player";
import { mergePlayers, playerByEmail } from "@/lib/results";
import { authClient } from "@/lib/supabaseAuth";

export const dynamic = "force-dynamic";

/** Player sign-in step 2: exchange the code, find/create the player, absorb this device's history. */
export async function GET(request: NextRequest) {
  if (!db()) return NextResponse.json({ ok: false }, { status: 404 });
  const back = request.nextUrl.searchParams.get("back") ?? "/";
  const code = request.nextUrl.searchParams.get("code");
  const res = NextResponse.redirect(new URL(back, request.url), 303);
  if (!code) return res;
  const { data, error } = await authClient(request, res).auth.exchangeCodeForSession(code);
  const email = data?.user?.email?.toLowerCase();
  if (error || !email) return NextResponse.redirect(new URL(`${back}?login=error`, request.url), 303);

  const player = await playerByEmail(email);
  const device = request.cookies.get(DEVICE_COOKIE)?.value;
  if (isUuid(device)) await mergePlayers(device, player.id);
  res.cookies.set(PLAYER_COOKIE, issueSession(player.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
