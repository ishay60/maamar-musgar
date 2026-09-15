import { NextRequest, NextResponse } from "next/server";
import { LOGIN_FLAG_COOKIE, isAdminEnabled, isEditor } from "@/lib/adminAccess";
import { authClient } from "@/lib/supabaseAuth";

export const dynamic = "force-dynamic";

/** Step 1 of login: send a magic link, but only to an allowlisted editor. */
export async function POST(request: NextRequest) {
  if (!isAdminEnabled()) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const res = NextResponse.redirect(new URL("/admin", request.url), 303);
  const flag = (value: string) =>
    res.cookies.set(LOGIN_FLAG_COOKIE, value, { httpOnly: true, sameSite: "lax", path: "/admin", maxAge: 60 });

  // Unknown emails get the same "sent" message so the form does not reveal the allowlist.
  if (!email || !(await isEditor(email))) {
    flag("sent");
    return res;
  }
  const { error } = await authClient(request, res).auth.signInWithOtp({
    email,
    options: { emailRedirectTo: new URL("/api/admin/callback", request.url).toString() },
  });
  flag(error ? "error" : "sent");
  return res;
}
