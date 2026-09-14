import { describe, expect, it } from "vitest";
import { checkPassword, isAdminAuthed, isAdminEnabled, sessionToken } from "../adminAccess";

const deployed = { ADMIN_PASSWORD: "s3cret" };

describe("isAdminEnabled", () => {
  it("is on for the local workspace or when a password is configured", () => {
    expect(isAdminEnabled({ WORKSPACE: "local" })).toBe(true);
    expect(isAdminEnabled(deployed)).toBe(true);
  });

  it("is off otherwise, ignoring the public build-time flag", () => {
    expect(isAdminEnabled({})).toBe(false);
    expect(isAdminEnabled({ NEXT_PUBLIC_WORKSPACE: "local" })).toBe(false);
  });
});

describe("isAdminAuthed", () => {
  it("needs no cookie locally", () => {
    expect(isAdminAuthed(undefined, { WORKSPACE: "local" })).toBe(true);
  });

  it("accepts only the matching session token when deployed", () => {
    expect(isAdminAuthed(sessionToken("s3cret"), deployed)).toBe(true);
    expect(isAdminAuthed(sessionToken("wrong"), deployed)).toBe(false);
    expect(isAdminAuthed(undefined, deployed)).toBe(false);
    expect(isAdminAuthed("s3cret", deployed)).toBe(false); // raw password is not a token
  });

  it("never authenticates when nothing is configured", () => {
    expect(isAdminAuthed(sessionToken(""), {})).toBe(false);
  });
});

describe("checkPassword", () => {
  it("compares against ADMIN_PASSWORD", () => {
    expect(checkPassword("s3cret", deployed)).toBe(true);
    expect(checkPassword("s3cre", deployed)).toBe(false);
    expect(checkPassword("", {})).toBe(false);
  });
});
