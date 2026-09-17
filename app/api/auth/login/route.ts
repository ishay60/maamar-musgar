import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authClient } from "@/lib/supabaseAuth";

export const dynamic = "force-dynamic";

/** Player sign-in step 1: send a magic link to any email. */
export async function POST(request: NextRequest) {
  if (!db()) return NextResponse.json({ ok: false }, { status: 404 });
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const back = String(form.get("back") ?? "/");
  const res = NextResponse.redirect(new URL(`${back}${back.includes("?") ? "&" : "?"}login=sent`, request.url), 303);
  if (!email) return res;
  await authClient(request, res).auth.signInWithOtp({
    email,
    options: { emailRedirectTo: new URL(`/api/auth/callback?back=${encodeURIComponent(back)}`, request.url).toString() },
  });
  return res;
}
