"use client";

import { useEffect } from "react";
import { LEGACY_HOST, SITE_URL } from "@/lib/player";

/**
 * When Supabase does not recognise a magic link's redirect it sends the player
 * to its Site URL instead, with the session in #access_token (or a PKCE
 * ?code=). Catch those landings on any page and route them to the sign-in
 * handlers on the real domain.
 */
export function AuthLanding() {
  useEffect(() => {
    const { hostname, pathname, search, hash } = window.location;
    const params = new URLSearchParams(hash.slice(1));
    if (pathname !== "/auth/callback" && (params.has("access_token") || params.has("error_code"))) {
      // Same origin first: /auth/callback forwards on from the old domain with this origin's device id.
      window.location.replace(`/auth/callback${hash}`);
      return;
    }
    // A PKCE code can only be redeemed where its verifier cookie lives: the real domain.
    const code = new URLSearchParams(search).get("code");
    if (code && pathname === "/") {
      const base = hostname === LEGACY_HOST ? SITE_URL : "";
      window.location.replace(`${base}/api/auth/callback?code=${encodeURIComponent(code)}`);
    }
  }, []);
  return null;
}
