export type DiffOp = "same" | "added" | "removed";

export interface DiffToken {
  op: DiffOp;
  text: string;
}

const tokenize = (s: string): string[] => (s.match(/\s+|[^\s]+/g) ?? []);

/**
 * Word-level diff (LCS) between two strings. Returns tokens flagged as
 * unchanged / added / removed so the UI can highlight both sides at once.
 */
export function wordDiff(before: string, after: string): DiffToken[] {
  const a = tokenize(before ?? "");
  const b = tokenize(after ?? "");
  const n = a.length;
  const m = b.length;

  // Guard against pathological sizes — fall back to a whole-block replace.
  if (n * m > 250_000) {
    const out: DiffToken[] = [];
    if (before) out.push({ op: "removed", text: before });
    if (after) out.push({ op: "added", text: after });
    return out;
  }

  const lcs: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  const raw: DiffToken[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      raw.push({ op: "same", text: a[i] });
      i++;
      j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      raw.push({ op: "removed", text: a[i] });
      i++;
    } else {
      raw.push({ op: "added", text: b[j] });
      j++;
    }
  }
  while (i < n) raw.push({ op: "removed", text: a[i++] });
  while (j < m) raw.push({ op: "added", text: b[j++] });

  // Merge adjacent tokens with the same op for cleaner rendering.
  const merged: DiffToken[] = [];
  for (const t of raw) {
    const last = merged[merged.length - 1];
    if (last && last.op === t.op) last.text += t.text;
    else merged.push({ ...t });
  }
  return merged;
}

export const hasDiff = (tokens: DiffToken[]) => tokens.some((t) => t.op !== "same");
