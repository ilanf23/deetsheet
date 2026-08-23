import { describe, expect, it } from "vitest";
import { hasMarkdownLink, isSafeHref, parseMarkdownLinks } from "@/lib/markdownLinks";

describe("parseMarkdownLinks", () => {
  it("returns plain text untouched when there is no markdown link", () => {
    const s = "Hi there.\n\nPlease read the rules at https://deetsheet.com/rules";
    expect(parseMarkdownLinks(s)).toEqual([{ type: "text", text: s }]);
    expect(hasMarkdownLink(s)).toBe(false);
  });

  it("parses a site-relative link", () => {
    expect(parseMarkdownLinks("See [Rules](/rules) first.")).toEqual([
      { type: "text", text: "See " },
      { type: "link", text: "Rules", href: "/rules" },
      { type: "text", text: " first." },
    ]);
  });

  it("parses http, https and mailto", () => {
    expect(isSafeHref("https://x.com")).toBe(true);
    expect(isSafeHref("http://x.com")).toBe(true);
    expect(isSafeHref("mailto:a@b.com")).toBe(true);
  });

  it("rejects unsafe schemes and protocol-relative urls, keeping the label as text", () => {
    expect(isSafeHref("javascript:alert(1)")).toBe(false);
    expect(isSafeHref("//evil.com")).toBe(false);
    expect(isSafeHref("data:text/html;base64,x")).toBe(false);
    expect(parseMarkdownLinks("a [x](javascript:alert) b")).toEqual([
      { type: "text", text: "a " },
      { type: "text", text: "x" },
      { type: "text", text: " b" },
    ]);
    // Never emits a link token for an unsafe href, even with stray parens.
    expect(
      parseMarkdownLinks("a [x](javascript:alert(1)) b").some((t) => t.type === "link"),
    ).toBe(false);
  });

  it("preserves newlines and handles multiple links", () => {
    expect(parseMarkdownLinks("[A](/a)\n[B](/b)")).toEqual([
      { type: "link", text: "A", href: "/a" },
      { type: "text", text: "\n" },
      { type: "link", text: "B", href: "/b" },
    ]);
  });

  it("does not treat raw angle brackets as markup", () => {
    const s = "<script>alert(1)</script>";
    expect(parseMarkdownLinks(s)).toEqual([{ type: "text", text: s }]);
  });
});
