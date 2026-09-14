import { describe, expect, it } from "vitest";
import { isAdminEnabled } from "../adminAccess";

describe("isAdminEnabled", () => {
  it("enables admin for the local workspace", () => {
    expect(isAdminEnabled({ WORKSPACE: "local" })).toBe(true);
  });

  it("disables admin outside the local workspace", () => {
    expect(isAdminEnabled({ WORKSPACE: "production" })).toBe(false);
    expect(isAdminEnabled({})).toBe(false);
  });

  it("ignores the public build-time flag", () => {
    expect(isAdminEnabled({ NEXT_PUBLIC_WORKSPACE: "local" })).toBe(false);
  });
});
