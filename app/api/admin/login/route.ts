import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  LOGIN_FAILED_COOKIE,
  checkPassword,
  isAdminEnabled,
  sessionToken,
} from "@/lib/adminAccess";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!isAdminEnabled()) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }
  const form = await request.formData();
  const password = String(form.get("password") ?? "");
  const res = NextResponse.redirect(new URL("/admin", request.url), 303);
  const secure = process.env.NODE_ENV === "production";

  if (!checkPassword(password)) {
    // Short-lived flag so the login form can say "wrong password" instead of silently reloading.
    res.cookies.set(LOGIN_FAILED_COOKIE, "1", { httpOnly: true, sameSite: "lax", secure, path: "/admin", maxAge: 10 });
    return res;
  }

  res.cookies.delete(LOGIN_FAILED_COOKIE);
  res.cookies.set(ADMIN_COOKIE, sessionToken(process.env.ADMIN_PASSWORD!.trim()), {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
