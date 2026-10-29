import { describe, expect, it } from "vitest";
import { canonicalTopicHref, canonicalTopicPath, resolveTopic, topicSlug } from "@/lib/topicSlug";

describe("topicSlug", () => {
  it.each([
    ["Lake Forest", "lake-forest"],
    ["Electric Vehicle (EV)", "electric-vehicle-ev"],
    ["University of Wisconsin - Madison", "university-of-wisconsin-madison"],
    ["McDonald's", "mcdonalds"],
    ["Mother's Day", "mothers-day"],
    ["Mother’s Day", "mothers-day"],
    [" -- LAKE   Forest!! ", "lake-forest"],
  ])("canonicalizes %s", (name, expected) => {
    expect(topicSlug(name)).toBe(expected);
  });
});

describe("topic route resolution", () => {
  const oldest = { id: "old", name: "North Carolina", postCount: 0, createdAt: "2026-04-23T14:35:39Z" };
  const newest = { id: "new", name: "North Carolina", postCount: 0, createdAt: "2026-05-30T18:04:37Z" };
  it.each(["Lake%20Forest", "Lake Forest", "LAKE FOREST", "lake-forest", "LAKE-FOREST"])("accepts %s", (param) => {
    const topic = { ...oldest, name: "Lake Forest" };
    expect(resolveTopic([topic], param)?.id).toBe("old");
  });
  it("chooses the topic with the most approved posts", () => {
    expect(resolveTopic([oldest, { ...newest, postCount: 2 }], "north-carolina")?.id).toBe("new");
  });
  it("breaks equal approved counts by oldest creation without mutating the list", () => {
    const topics = [newest, oldest];
    expect(resolveTopic(topics, "North%20Carolina")?.id).toBe("old");
    expect(topics.map((topic) => topic.id)).toEqual(["new", "old"]);
  });
  it("returns null for an unknown or malformed parameter", () => {
    expect(resolveTopic([oldest], "unknown-topic")).toBeNull();
    expect(resolveTopic([oldest], "%E0%A4%A")).toBeNull();
  });
});

describe("canonical topic links", () => {
  it("keeps the post slug unchanged", () => {
    expect(canonicalTopicPath("/topic/Lake%20Forest/post/market-square-ebf4061d", "Lake Forest"))
      .toBe("/topic/lake-forest/post/market-square-ebf4061d");
  });
  it("normalizes notification paths and preserves query and hash", () => {
    expect(canonicalTopicHref("/topic/Lake%20Forest/post/market-square-ebf4061d?size=25#comments"))
      .toBe("/topic/lake-forest/post/market-square-ebf4061d?size=25#comments");
  });
  it("normalizes email URLs using the same slug rules", () => {
    expect(canonicalTopicHref("https://deetsheet.com/topic/Mother’s%20Day/post/a-12345678?x=1#discussion"))
      .toBe("https://deetsheet.com/topic/mothers-day/post/a-12345678?x=1#discussion");
  });
  it("leaves unrelated and external URLs unchanged", () => {
    expect(canonicalTopicHref("/profile?edit=abc")).toBe("/profile?edit=abc");
    expect(canonicalTopicHref("https://other.example/topic/Lake%20Forest")).toBe("https://other.example/topic/Lake%20Forest");
  });
});