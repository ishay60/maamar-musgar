import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isUuid, safeBack, withParam } from "@/lib/player";
import { magicLinkClient } from "@/lib/supabaseAuth";

export const dynamic = "force-dynamic";

/**
 * Player sign-in step 1: send a magic link to any email. The link lands on
 * /auth/callback on this same domain and names the device that asked, so its
 * history merges even if the email opens in a different browser.
 */
export async function POST(request: NextRequest) {
  if (!db()) return NextResponse.json({ ok: false }, { status: 404 });
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const back = safeBack(String(form.get("back") ?? "/"));
  const device = String(form.get("device") ?? "");
  if (!email) return NextResponse.redirect(new URL(back, request.url), 303);

  const callback = new URL("/auth/callback", request.url);
  callback.searchParams.set("back", back);
  if (isUuid(device)) callback.searchParams.set("device", device);
  const { error } = await magicLinkClient().auth.signInWithOtp({ email, options: { emailRedirectTo: callback.toString() } });
  return NextResponse.redirect(new URL(withParam(back, "login", error ? "error" : "sent"), request.url), 303);
}
