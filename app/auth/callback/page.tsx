"use client";

import { useEffect, useState } from "react";
import { LEGACY_HOST, SITE_URL, getDeviceId, isUuid, safeBack, withParam } from "@/lib/player";

/**
 * Player sign-in step 2 (browser side). The magic link lands here with the
 * session in the #fragment, which never reaches the server on its own. Hand the
 * token to /api/auth/session, then go back to the puzzle.
 */
export default function AuthCallbackPage() {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const back = safeBack(query.get("back"));

    // Landed on the old domain: carry this origin's device over to the real one.
    if (window.location.hostname === LEGACY_HOST) {
      const next = new URL("/auth/callback", SITE_URL);
      query.forEach((v, k) => next.searchParams.set(k, v));
      next.searchParams.set("legacyDevice", getDeviceId());
      next.hash = window.location.hash;
      window.location.replace(next.toString());
      return;
    }

    const token = hash.get("access_token");
    const finish = (ok: boolean) => window.location.replace(withParam(back, "login", ok ? "ok" : "error"));
    if (!token) return finish(false);
    const devices = [query.get("device"), query.get("legacyDevice"), getDeviceId()].filter(isUuid);
    fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken: token, devices }),
    })
      .then((r) => finish(r.ok))
      .catch(() => setFailed(true));
  }, []);

  return (
    <main className="p-8 text-center puzzle-mono text-[13px]" style={{ color: "#6b6356" }}>
      {failed ? (
        <>
          הכניסה נכשלה. <a href="/" className="underline">חזרה לחידה</a>
        </>
      ) : (
        "מתחברים…"
      )}
    </main>
  );
}
