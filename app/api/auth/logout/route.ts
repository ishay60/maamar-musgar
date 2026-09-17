import { NextRequest, NextResponse } from "next/server";
import { PLAYER_COOKIE } from "@/lib/player";

export async function POST(request: NextRequest) {
  const res = NextResponse.redirect(new URL("/", request.url), 303);
  res.cookies.set(PLAYER_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
