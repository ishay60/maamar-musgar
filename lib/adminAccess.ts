import { createHash, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE = "admin_session";
export const LOGIN_FAILED_COOKIE = "admin_login_failed";

type Env = Record<string, string | undefined>;

/** Studio exists at all: local workspace, or a password is configured (deployed). */
export function isAdminEnabled(env: Env = process.env): boolean {
  return env.WORKSPACE === "local" || !!env.ADMIN_PASSWORD;
}

/** Local workspace needs no login; deployed studio needs the session cookie. */
export function isAdminAuthed(cookieValue: string | undefined, env: Env = process.env): boolean {
  if (env.WORKSPACE === "local") return true;
  if (!env.ADMIN_PASSWORD || !cookieValue) return false;
  return safeEqual(cookieValue, sessionToken(env.ADMIN_PASSWORD.trim()));
}

export function checkPassword(candidate: string, env: Env = process.env): boolean {
  const expected = env.ADMIN_PASSWORD?.trim();
  return !!expected && safeEqual(candidate.trim(), expected);
}

/** Cookie value: a hash of the password, so the password itself never sits in the browser. */
export function sessionToken(password: string): string {
  return createHash("sha256").update(`admin-session:${password}`).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}
