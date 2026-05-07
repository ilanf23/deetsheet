import type { CommentNode } from "@/components/CommentItem";

/** Tunable weights for engagement + recency hybrid ranking. */
export const RANKING_CONFIG = {
  /** Weight on `like_count` (baseline unit). */
  W_LIKE: 1.0,
  /** Weight on subtree reply count — replies signal higher effort than likes. */
  W_REPLY: 2.0,
  /** Max recency boost at age 0 (additive to log10 engagement term). */
  R_MAX: 2.0,
  /** Recency half-life scale in hours (exponential decay). */
  TAU: 12,
} as const;

const MS_PER_HOUR = 3_600_000;

function engagement(node: CommentNode): number {
  return (
    RANKING_CONFIG.W_LIKE * node.likeCount +
    RANKING_CONFIG.W_REPLY * node.descendantCount
  );
}

/**
 * Hybrid score: log-scaled engagement + exponential recency boost.
 * Higher score = closer to top of list among siblings.
 */
export function scoreComment(node: CommentNode, nowMs: number): number {
  const eng = engagement(node);
  const logEng = Math.log10(1 + Math.max(0, eng));
  const ageMs = Math.max(0, nowMs - node.createdAt.getTime());
  const ageHours = ageMs / MS_PER_HOUR;
  const recency =
    RANKING_CONFIG.R_MAX * Math.exp(-ageHours / RANKING_CONFIG.TAU);
  return logEng + recency;
}

/** Descending hot score, then newer `createdAt` when scores match. */
export function compareCommentsByHotThenNewest(
  a: CommentNode,
  b: CommentNode,
  nowMs: number,
): number {
  const scoreDiff = scoreComment(b, nowMs) - scoreComment(a, nowMs);
  if (scoreDiff !== 0) return scoreDiff;
  return b.createdAt.getTime() - a.createdAt.getTime();
}

/**
 * Recursively sorts siblings at every depth by hot score (newer wins on tie).
 * Returns new tree nodes (shallow copy per node, new children arrays).
 */
export function sortByHotScore(nodes: CommentNode[], nowMs: number): CommentNode[] {
  return [...nodes]
    .sort((a, b) => compareCommentsByHotThenNewest(a, b, nowMs))
    .map((n) => ({
      ...n,
      children: sortByHotScore(n.children, nowMs),
    }));
}
