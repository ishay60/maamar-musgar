import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
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

/**
 * Player magic links use the implicit flow: the link carries the session in its
 * #fragment instead of a PKCE code. A PKCE code can only be redeemed in the
 * browser that asked for the link, which fails whenever the email opens in
 * another browser (Chrome on iOS → Mail → Safari) or on another domain.
 */
export function magicLinkClient() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { flowType: "implicit", persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
