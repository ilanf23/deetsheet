/**
 * Quick-insert markdown links offered to admins when writing to a member.
 *
 * Paths come from the live router in `src/App.tsx` (`/rules`, `/inspiration`)
 * and match the labels used in `DeetHeader` / `DeetFooter`.
 */
export const LINK_SHORTCUTS: { label: string; path: string }[] = [
  { label: "Rules & Guidelines", path: "/rules" },
  { label: "Need Inspiration?", path: "/inspiration" },
];

/**
 * Where a quick-inserted markdown link should land.
 *
 * The textarea only has a meaningful caret when it is actually focused. When it
 * is not, browsers report `selectionStart === value.length`, which used to make
 * the link fuse onto the sign-off ("— The DeetSheet team[Rules](/rules)").
 * So when unfocused we insert *before* the sign-off block instead of at the end.
 */
export function insertMarkdownLink(
  text: string,
  label: string,
  path: string,
  caretStart: number | null,
  caretEnd: number | null,
): { text: string; caret: number } {
  const snippet = `[${label}](${path})`;

  const splice = (at: number, until: number) => {
    const before = text.slice(0, at);
    const after = text.slice(until);
    const padLeft = before.length > 0 && !/\s$/.test(before) ? " " : "";
    const padRight = after.length > 0 && !/^[\s.,;:!?)]/.test(after) ? " " : "";
    return {
      text: `${before}${padLeft}${snippet}${padRight}${after}`,
      caret: before.length + padLeft.length + snippet.length,
    };
  };

  if (caretStart !== null) return splice(caretStart, caretEnd ?? caretStart);

  // Unfocused: drop it just before the trailing sign-off line, if there is one.
  const signOff = /\n[^\S\n]*[-—][^\n]*\s*$/.exec(text);
  if (signOff) {
    const at = signOff.index;
    const before = text.slice(0, at).replace(/\s+$/, "");
    const rest = text.slice(at);
    return {
      text: `${before} ${snippet}${rest}`,
      caret: before.length + 1 + snippet.length,
    };
  }
  return splice(text.length, text.length);
}
