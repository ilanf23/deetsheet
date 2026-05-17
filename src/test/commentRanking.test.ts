import { describe, expect, it } from "vitest";
import type { CommentNode } from "@/components/CommentItem";
import {
  RANKING_CONFIG,
  compareCommentsByHotThenNewest,
  scoreComment,
  sortByHotScore,
} from "@/lib/commentRanking";

const MS_HOUR = 3_600_000;
const MS_DAY = 24 * MS_HOUR;

function makeNode(
  overrides: Partial<CommentNode> &
    Pick<CommentNode, "id" | "createdAt">,
): CommentNode {
  return {
    username: "t",
    avatarUrl: null,
    content: "",
    parentCommentId: null,
    parentUsername: null,
    likeCount: 0,
    children: [],
    descendantCount: 0,
    ...overrides,
  };
}

describe("scoreComment", () => {
  it("ranks brand-new zero-engagement above stale zero-engagement", () => {
    const now = Date.UTC(2026, 0, 15, 12, 0, 0);
    const fresh = makeNode({
      id: "fresh",
      createdAt: new Date(now),
      likeCount: 0,
      descendantCount: 0,
    });
    const stale = makeNode({
      id: "stale",
      createdAt: new Date(now - 30 * MS_DAY),
      likeCount: 0,
      descendantCount: 0,
    });
    expect(scoreComment(fresh, now)).toBeGreaterThan(scoreComment(stale, now));
  });

  it("lets strong engagement beat a brand-new zero-engagement comment", () => {
    const now = Date.UTC(2026, 0, 15, 12, 0, 0);
    const brandNew = makeNode({
      id: "new",
      createdAt: new Date(now),
      likeCount: 0,
      descendantCount: 0,
    });
    // At 2d age, 50 likes alone is below default recency ceiling; ~6h + 50 likes clears it.
    const engaged = makeNode({
      id: "hot",
      createdAt: new Date(now - 6 * MS_HOUR),
      likeCount: 50,
      descendantCount: 0,
    });
    expect(scoreComment(engaged, now)).toBeGreaterThan(scoreComment(brandNew, now));
  });

  it("weights replies more than likes at same total weight units", () => {
    const now = Date.UTC(2026, 0, 15, 12, 0, 0);
    const t0 = new Date(now - MS_HOUR);
    const likesOnly = makeNode({
      id: "likes",
      createdAt: t0,
      likeCount: 4,
      descendantCount: 0,
    });
    const repliesOnly = makeNode({
      id: "replies",
      createdAt: t0,
      likeCount: 0,
      descendantCount: 2,
    });
    // W_LIKE*4 == W_REPLY*2 == 4
    expect(scoreComment(repliesOnly, now)).toBe(scoreComment(likesOnly, now));
    const moreReplies = makeNode({
      id: "moreReplies",
      createdAt: t0,
      likeCount: 0,
      descendantCount: 3,
    });
    expect(scoreComment(moreReplies, now)).toBeGreaterThan(scoreComment(likesOnly, now));
  });

  it("is deterministic for fixed nowMs", () => {
    const now = 1_700_000_000_000;
    const n = makeNode({
      id: "a",
      createdAt: new Date(now - MS_HOUR),
      likeCount: 3,
      descendantCount: 1,
    });
    expect(scoreComment(n, now)).toBe(scoreComment(n, now));
  });
});

describe("compareCommentsByHotThenNewest", () => {
  it("returns 0 when hot score and createdAt match", () => {
    const nowMs = Date.UTC(2026, 0, 15, 12, 0, 0);
    const t = new Date(nowMs - 6 * MS_HOUR);
    const a = makeNode({
      id: "a",
      createdAt: t,
      likeCount: 3,
      descendantCount: 1,
    });
    const b = makeNode({
      id: "b",
      createdAt: t,
      likeCount: 3,
      descendantCount: 1,
    });
    expect(compareCommentsByHotThenNewest(a, b, nowMs)).toBe(0);
  });
});

describe("sortByHotScore", () => {
  it("orders siblings by descending hot score", () => {
    const now = Date.UTC(2026, 0, 15, 12, 0, 0);
    const low = makeNode({
      id: "low",
      createdAt: new Date(now - 20 * MS_DAY),
      likeCount: 0,
      descendantCount: 0,
    });
    const high = makeNode({
      id: "high",
      createdAt: new Date(now - MS_HOUR),
      likeCount: 10,
      descendantCount: 0,
    });
    expect(sortByHotScore([low, high], now).map((n) => n.id)).toEqual(["high", "low"]);
  });

  it("sorts children recursively", () => {
    const now = Date.UTC(2026, 0, 15, 12, 0, 0);
    const youngChild = makeNode({
      id: "child-young",
      createdAt: new Date(now),
      likeCount: 0,
      descendantCount: 0,
      parentCommentId: "root",
    });
    const oldChild = makeNode({
      id: "child-old",
      createdAt: new Date(now - 5 * MS_DAY),
      likeCount: 0,
      descendantCount: 0,
      parentCommentId: "root",
    });
    const grandYoung = makeNode({
      id: "grand-young",
      createdAt: new Date(now),
      likeCount: 0,
      descendantCount: 0,
      parentCommentId: "child-old",
    });
    const grandOld = makeNode({
      id: "grand-old",
      createdAt: new Date(now - 5 * MS_DAY),
      likeCount: 0,
      descendantCount: 0,
      parentCommentId: "child-old",
    });
    const oldChildWithGrandkids: CommentNode = {
      ...oldChild,
      descendantCount: 2,
      children: [grandOld, grandYoung],
    };
    const root: CommentNode = {
      ...makeNode({
        id: "root",
        createdAt: new Date(now - 10 * MS_DAY),
        likeCount: 0,
        descendantCount: 3,
      }),
      children: [oldChildWithGrandkids, youngChild],
    };
    const [firstRoot] = sortByHotScore([root], now);
    expect(firstRoot.children.map((c) => c.id)).toEqual([
      "child-young",
      "child-old",
    ]);
    const nested = firstRoot.children.find((c) => c.id === "child-old");
    expect(nested?.children.map((c) => c.id)).toEqual([
      "grand-young",
      "grand-old",
    ]);
  });

  it("exposes tuning constants from the plan", () => {
    expect(RANKING_CONFIG.W_LIKE).toBe(1.0);
    expect(RANKING_CONFIG.W_REPLY).toBe(2.0);
    expect(RANKING_CONFIG.R_MAX).toBe(2.0);
    expect(RANKING_CONFIG.TAU).toBe(12);
  });
});
