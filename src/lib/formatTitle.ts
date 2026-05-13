/**
 * Normalize a display title so wrapped lines never start with punctuation.
 * Strips spaces that appear before commas, periods, semicolons, colons,
 * question marks, exclamation marks, and closing brackets — without that
 * leading space, the browser has no break opportunity directly before the
 * punctuation, so it stays attached to the preceding word on the same line.
 * Also collapses any runs of whitespace introduced by the cleanup.
 */
export function formatTitle(title: string | null | undefined): string {
  if (!title) return "";
  return title
    .replace(/\s+([,.;:!?)\]])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}
