import { describe, expect, it } from "vitest";
import { getAdminAuthorLabel, getAuthorLabel } from "@/lib/authorLabel";

describe("public contribution author label", () => {
  it("uses the username even when a real name exists", () => {
    const profile = { username: "  matt  ", name: "Matt Brueggeman" };
    expect(getAuthorLabel(profile)).toBe("matt");
  });

  it("falls back to the trimmed real name when no username is set", () => {
    const profile = { username: null, name: "Matt Brueggeman" };
    expect(getAuthorLabel(profile)).toBe("Matt Brueggeman");
    expect(getAuthorLabel({ username: "  ", name: "  Matt Brueggeman  " })).toBe("Matt Brueggeman");
  });

  it("falls back to DeetSheet Member when neither is set", () => {
    expect(getAuthorLabel({ username: null, name: null })).toBe("DeetSheet Member");
    expect(getAuthorLabel({ username: "  ", name: "  " })).toBe("DeetSheet Member");
    expect(getAuthorLabel({ username: "  " })).toBe("DeetSheet Member");
    expect(getAuthorLabel(null)).toBe("DeetSheet Member");
  });
});

describe("admin author label", () => {
  it("uses the username even when a real name exists", () => {
    const profile = { username: "matt", name: "Matt Brueggeman" };
    expect(getAdminAuthorLabel(profile)).toBe("matt");
  });

  it("flags the real name when no username is set", () => {
    const profile = { username: null, name: "Matt Brueggeman" };
    expect(getAdminAuthorLabel(profile)).toBe("Matt Brueggeman (no username)");
    expect(getAdminAuthorLabel({ username: "  ", name: "Matt Brueggeman" })).toBe(
      "Matt Brueggeman (no username)"
    );
  });

  it("falls back to DeetSheet Member when neither is set", () => {
    expect(getAdminAuthorLabel({ username: null, name: null })).toBe("DeetSheet Member");
    expect(getAdminAuthorLabel(null)).toBe("DeetSheet Member");
  });
});