# Profile Activity Search — Design

**Date:** 2026-06-01
**Status:** Approved
**Surface:** `src/pages/ProfileView.tsx`

## Goal

Let a viewer narrow the content shown on a profile's tabs by typing a query.
Scoped to **this profile's own content**, filtering the **currently active tab**.

## Decisions

- **Scope:** this profile's own content (not site-wide, not people search).
- **Interaction:** filter the active tab (not cross-content grouped results).
- **Content types:** Posts and Topics. No Comments search (no comments data yet).

## Behavior

- A single search input sits just under the tab strip, rendered **only** when the
  active tab is `posts` or `topics`. Hidden on Comments / Favorites / Following /
  Followers (out of scope).
- Typing filters the active tab's list live, case-insensitive:
  - **Posts** → match `title` + `content`.
  - **Topics** → match `name` + `description`.
- Filtering is **client-side** over already-loaded data (`userPosts`,
  `userTopics` are fully fetched today). No new DB queries.
- A clear **✕** shows when there is text. Clicking it, or switching tabs, resets
  the query so a Posts search does not leak into Topics.

## UI

- Mirrors the header `SearchBar` visual language: left `Search` icon, muted
  placeholder, shadcn `Input` with `bg-muted` styling.
- Placeholder is tab-aware: `"Search your posts…"` / `"Search topics…"`.
- Own row above `TabsContent`; full-width on mobile, `max-w-sm` on desktop.
- No-match empty state swaps copy: `No posts match "{query}."` /
  `No topics match "{query}."`. The genuine-empty state ("No posts yet.") still
  shows when the unfiltered list is empty.

## Color contract (CLAUDE.md)

- Icon + placeholder are `text-muted-foreground` (non-interactive supporting
  text), consistent with the header search. No green text introduced; the
  interactivity contract holds. The ✕ is an icon button, not a text link.

## Non-goals

- No Comments search (Comments tab has no data yet).
- Tab count badges stay as **totals**, not filtered counts.
- Topics tab currently lists *all* topics, not just this user's — left as-is;
  the filter narrows whatever the tab shows. Topic-scoping is out of scope.

## Implementation footprint

All changes inside `src/pages/ProfileView.tsx`:

- Add `query` state; reset it in the existing `activeTab` effect.
- Derive `filteredPosts` / `filteredTopics` via `useMemo`.
- Render the input row (gated on active tab) and wire the Posts/Topics
  `TabsContent` lists + empty states to the filtered arrays.
- Import `Input` and `Search` / `X` icons.

No new files. No backend changes.
</content>
</invoke>
