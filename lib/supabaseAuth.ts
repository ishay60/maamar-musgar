import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";

/**
 * Supabase client for the magic-link handshake only. The PKCE verifier lives in
 * a cookie between "send link" and "callback"; every other cookie Supabase
 * tries to set is written with maxAge 0 so no Supabase session persists. Our
 * own signed admin cookie is the session.
 */
export function authClient(req: NextRequest, res: NextResponse) {
  return createServerClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (cookies) => {
        for (const { name, value, options } of cookies) {
          const keep = name.endsWith("code-verifier") && value;
          res.cookies.set(name, keep ? value : "", { ...options, httpOnly: true, sameSite: "lax", path: "/", maxAge: keep ? 600 : 0 });
        }
      },
    },
  });
}
