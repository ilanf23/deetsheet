import { describe, expect, it } from "vitest";
import { getAuthorLabel } from "@/lib/authorLabel";

describe("contribution author privacy", () => {
  it("uses the username even when a real name exists", () => {
    const profile = { username: "matt", name: "Matt Brueggeman" };
    expect(getAuthorLabel(profile)).toBe("matt");
  });

  it("falls back to DeetSheet Member, never the real name", () => {
    const profile = { username: null, name: "Matt Brueggeman" };
    expect(getAuthorLabel(profile)).toBe("DeetSheet Member");
    expect(getAuthorLabel({ username: "  " })).toBe("DeetSheet Member");
    expect(getAuthorLabel(null)).toBe("DeetSheet Member");
  });
});