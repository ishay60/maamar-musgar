import { createHmac, timingSafeEqual } from "node:crypto";
import { db } from "./db";

export const ADMIN_COOKIE = "admin_session";
/** Short-lived flag the login form reads: "sent" | "unknown" | "error". */
export const LOGIN_FLAG_COOKIE = "admin_login_flag";
const SESSION_DAYS = 30;

type Env = Record<string, string | undefined>;

/** Studio exists at all: local workspace, or the database is configured (deployed). */
export function isAdminEnabled(env: Env = process.env): boolean {
  return env.WORKSPACE === "local" || !!(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
}

/** Local workspace needs no login; deployed studio needs a valid signed session cookie. */
export function isAdminAuthed(cookieValue: string | undefined, env: Env = process.env, now = Date.now()): boolean {
  if (env.WORKSPACE === "local") return true;
  return !!readSession(cookieValue, env, now);
}

/** Is this email allowed into the studio? */
export async function isEditor(email: string): Promise<boolean> {
  const client = db();
  if (!client) return false;
  const { data } = await client.from("editors").select("email").eq("email", email.toLowerCase()).maybeSingle();
  return !!data;
}

/**
 * Session cookie: `email|expiresAt|hmac`. Signed with the service role key so
 * there is no second secret to manage; the browser never sees the key.
 */
export function issueSession(email: string, env: Env = process.env, now = Date.now()): string {
  const exp = now + SESSION_DAYS * 86_400_000;
  return `${email}|${exp}|${sign(`${email}|${exp}`, env)}`;
}

export function readSession(value: string | undefined, env: Env = process.env, now = Date.now()): string | null {
  if (!value) return null;
  const [email, exp, sig] = value.split("|");
  if (!email || !exp || !sig || Number(exp) < now) return null;
  return safeEqual(sig, sign(`${email}|${exp}`, env)) ? email : null;
}

export const SESSION_MAX_AGE = SESSION_DAYS * 86_400;

function sign(payload: string, env: Env): string {
  const secret = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) return "";
  return createHmac("sha256", secret).update(payload).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length > 0 && ab.length === bb.length && timingSafeEqual(ab, bb);
}
