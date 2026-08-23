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
