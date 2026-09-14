import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, checkPassword, isAdminEnabled, sessionToken } from "@/lib/adminAccess";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!isAdminEnabled()) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }
  const form = await request.formData();
  const password = String(form.get("password") ?? "");
  const res = NextResponse.redirect(new URL("/admin", request.url), 303);
  if (checkPassword(password)) {
    res.cookies.set(ADMIN_COOKIE, sessionToken(process.env.ADMIN_PASSWORD!), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  return res;
}
