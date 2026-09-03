import { describe, it, expect } from "vitest";
import { diffWords } from "@/lib/wordDiff";
describe("diff", () => {
  it("punctuation", () => {
    console.log(JSON.stringify(diffWords("A Day in A Life.", '"A Day in A Life".')));
  });
});
