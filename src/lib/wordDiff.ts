/**
 * Tiny word-level diff used by the admin review dialogs ("What changed").
 *
 * Algorithm: classic LCS (longest common subsequence) over tokens, walked back
 * into an ordered list of equal / removed / added runs. No dependencies.
 *
 * Tokenisation is punctuation-aware: words, runs of whitespace and individual
 * punctuation characters are separate tokens. That means wrapping a word in
 * quotes reads as a couple of tiny insertions instead of rewriting the whole
 * sentence.
 */

export type DiffOp = "equal" | "added" | "removed";

export interface DiffPart {
  type: DiffOp;
  value: string;
}

/** Words (letters/digits/apostrophes/hyphens inside words), whitespace runs, or single punctuation chars. */
export function tokenize(text: string): string[] {
  return text.match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*|\s+|[^\s\p{L}\p{N}]/gu) ?? [];
}

const isWhitespace = (t: string) => /^\s+$/.test(t);

/** LCS table over two token arrays. */
function lcsMatrix(a: string[], b: string[]): Uint32Array {
  const w = b.length + 1;
  const dp = new Uint32Array((a.length + 1) * w);
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      dp[i * w + j] =
        a[i] === b[j]
          ? dp[(i + 1) * w + (j + 1)] + 1
          : Math.max(dp[(i + 1) * w + j], dp[i * w + (j + 1)]);
    }
  }
  return dp;
}

/**
 * Word-level diff of two strings. Returns parts in reading order, with
 * consecutive parts of the same type merged so the rendered output is a
 * continuous block of text rather than one span per token.
 */
export function diffWords(before: string, after: string): DiffPart[] {
  const a = tokenize(before ?? "");
  const b = tokenize(after ?? "");

  // Guard against pathological inputs, the LCS table is O(n*m).
  const MAX = 4000;
  if (a.length > MAX || b.length > MAX) {
    const parts: DiffPart[] = [];
    if (before) parts.push({ type: "removed", value: before });
    if (after) parts.push({ type: "added", value: after });
    return parts;
  }

  const w = b.length + 1;
  const dp = lcsMatrix(a, b);

  const raw: DiffPart[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      raw.push({ type: "equal", value: a[i] });
      i++;
      j++;
    } else if (dp[(i + 1) * w + j] >= dp[i * w + (j + 1)]) {
      raw.push({ type: "removed", value: a[i] });
      i++;
    } else {
      raw.push({ type: "added", value: b[j] });
      j++;
    }
  }
  while (i < a.length) raw.push({ type: "removed", value: a[i++] });
  while (j < b.length) raw.push({ type: "added", value: b[j++] });

  // Whitespace that sits between two changed runs of the same type is folded
  // into that run so we don't emit dozens of micro-spans.
  const merged: DiffPart[] = [];
  for (const part of raw) {
    const last = merged[merged.length - 1];
    if (last && last.type === part.type) {
      last.value += part.value;
      continue;
    }
    // A lone whitespace token that was marked changed but is surrounded by
    // equal text reads better as unchanged.
    if (part.type !== "equal" && isWhitespace(part.value) && last && last.type === "equal") {
      last.value += part.value;
      continue;
    }
    merged.push({ ...part });
  }
  return merged;
}

/** True when the two strings differ once trailing whitespace is normalised. */
export function hasTextChange(before: string | null, after: string | null): boolean {
  return (before ?? "").trim() !== (after ?? "").trim();
}
