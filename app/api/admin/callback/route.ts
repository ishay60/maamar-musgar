import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, LOGIN_FLAG_COOKIE, SESSION_MAX_AGE, isAdminEnabled, isEditor, issueSession } from "@/lib/adminAccess";
import { authClient } from "@/lib/supabaseAuth";

export const dynamic = "force-dynamic";

/** Step 2 of login: the magic link lands here. Exchange the code, check the allowlist, set our cookie. */
export async function GET(request: NextRequest) {
  if (!isAdminEnabled()) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  const code = request.nextUrl.searchParams.get("code");
  const res = NextResponse.redirect(new URL("/admin", request.url), 303);
  const fail = () => {
    res.cookies.set(LOGIN_FLAG_COOKIE, "error", { httpOnly: true, sameSite: "lax", path: "/admin", maxAge: 60 });
    return res;
  };
  if (!code) return fail();

  const { data, error } = await authClient(request, res).auth.exchangeCodeForSession(code);
  const email = data?.user?.email?.toLowerCase();
  if (error || !email || !(await isEditor(email))) return fail();

  res.cookies.delete(LOGIN_FLAG_COOKIE);
  res.cookies.set(ADMIN_COOKIE, issueSession(email), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
