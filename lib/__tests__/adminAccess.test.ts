import { describe, expect, it } from "vitest";
import { isAdminAuthed, isAdminEnabled, issueSession, readSession } from "../adminAccess";

const deployed = { SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "sb_secret_test" };

describe("isAdminEnabled", () => {
  it("is on for the local workspace or when the database is configured", () => {
    expect(isAdminEnabled({ WORKSPACE: "local" })).toBe(true);
    expect(isAdminEnabled(deployed)).toBe(true);
  });

  it("is off otherwise, ignoring the public build-time flag", () => {
    expect(isAdminEnabled({})).toBe(false);
    expect(isAdminEnabled({ NEXT_PUBLIC_WORKSPACE: "local" })).toBe(false);
  });
});

describe("session cookie", () => {
  const now = 1_700_000_000_000;

  it("needs no cookie locally", () => {
    expect(isAdminAuthed(undefined, { WORKSPACE: "local" })).toBe(true);
  });

  it("round-trips a signed session", () => {
    const cookie = issueSession("a@b.c", deployed, now);
    expect(readSession(cookie, deployed, now)).toBe("a@b.c");
    expect(isAdminAuthed(cookie, deployed, now)).toBe(true);
  });

  it("rejects tampering, expiry, other secrets and garbage", () => {
    const cookie = issueSession("a@b.c", deployed, now);
    expect(readSession(cookie.replace("a@b.c", "z@b.c"), deployed, now)).toBeNull();
    expect(readSession(cookie, deployed, now + 31 * 86_400_000)).toBeNull();
    expect(readSession(cookie, { ...deployed, SUPABASE_SERVICE_ROLE_KEY: "other" }, now)).toBeNull();
    expect(readSession("a@b.c|123|", deployed, now)).toBeNull();
    expect(isAdminAuthed(undefined, deployed, now)).toBe(false);
  });

  it("never authenticates when nothing is configured", () => {
    expect(isAdminAuthed(issueSession("a@b.c", {}, now), {}, now)).toBe(false);
  });
});
