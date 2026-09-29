import { describe, expect, it } from "vitest";
import { safeBack, withParam } from "../player";

describe("sign-in redirects", () => {
  it("adds a param to a path that already has a query", () => {
    expect(withParam("/?date=2026-09-23", "login", "error")).toBe("/?date=2026-09-23&login=error");
    expect(withParam("/", "login", "sent")).toBe("/?login=sent");
  });

  it("never leaves the site", () => {
    expect(safeBack("https://evil.example/")).toBe("/");
    expect(safeBack("//evil.example/")).toBe("/");
    expect(safeBack("/\\evil.example")).toBe("/");
    expect(safeBack(null)).toBe("/");
    expect(withParam("//evil.example/x", "a", "b")).toBe("/?a=b");
  });
});
