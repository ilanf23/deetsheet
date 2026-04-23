# Topic Page redesign — editorial ranked list

## Goal

Redesign the middle column of the Topic Page so it reads as a clean, editorial, ranked list (per the reference mockup) instead of the current bordered-card feed. Add page-size pagination. Preserve DeetSheet's site-wide color contract and the existing 3-column layout.

## Scope

**In scope**
- Replace the card-row visual of `TopicPostListItem` with a flat row (horizontal divider, no border, no chevron, no avatar, no preview line).
- Restructure the topic header to sit above the list with larger title typography, inline `/CategoryName`, subtitle question, and right-aligned `FollowTopicButton`.
- Add pagination: a `Posts View` page-size dropdown (default 25) + "Show more" button, state persisted in the URL (`?size=N`).
- Restyle the bottom "Add your advice" affordance to match the row rhythm (flat row, not a bordered card).

**Out of scope**
- Inline rating picker on rows (rating still happens on the subtopic page).
- Participant-avatar cluster in the header.
- Numbered pager or server-side pagination.
- Black clickable titles (violates color contract — titles stay green).
- Any changes to sidebars, data hooks, Supabase queries, auth, routes, or the subtopic page.

## Design decisions (with rationale)

1. **Color contract preserved.** The reference mockup shows black clickable titles; DeetSheet's CLAUDE.md mandates that all clickable text be `text-primary` green. We match the mockup's layout, typography, density, and spacing — but titles render green. Rationale: the color contract is a site-wide semantic that matters more than visual parity with an external mockup.
2. **3-column layout retained.** Only the middle column changes. `TopicRecentlyAdded` (left), `EmailCaptureForm` + `TopicRecommendations` (right) stay exactly as-is.
3. **Rating cell keeps current format.** `★ 9.3 (9)` stays. The mockup's `9.3 | 9 You` / `Rate` cell is not adopted — adding inline rating state or a "You" tag is a separate feature.
4. **No participant-avatar cluster.** Header stays minimal.
5. **Pagination is real, not cosmetic.** The dropdown selects page size and the URL carries `?size=N`. "Show more" is append-style (not numbered pages).

## Architecture

### Files touched
- `src/pages/TopicPage.tsx` — header layout refactor; adds `useSearchParams` + `size` state + `rendered` state; slices `posts` before mapping; renders `PaginationFooter`.
- `src/components/TopicPostListItem.tsx` — full visual rewrite (row, not card).
- `src/components/AddPostBar.tsx` — restyle trigger to match the flat-row rhythm. No change to dialog/flow.
- **New:** `src/components/TopicPaginationFooter.tsx` — the `Posts View [ 25 ▾ ]` dropdown + `Show more` button + "N more" counter.

No changes to: `src/hooks/useSupabaseTopics.ts`, `src/integrations/supabase/*`, route config, sidebars, or the subtopic page.

### Data flow (no new queries)

```
TopicPage
  ├─ useTopicByName(topicName)        ← unchanged
  ├─ usePostsByTopic(topic.id)        ← unchanged; returns all posts
  ├─ [searchParams] size = ?size ?? 25
  ├─ [state] rendered = min(size, posts.length)
  ├─ visiblePosts = posts.slice(0, rendered)
  ├─ renders header + list(visiblePosts) + AddPostBar + PaginationFooter
  └─ PaginationFooter
       ├─ onSizeChange(n) → setSearchParams({size: n}); setRendered(n)
       └─ onShowMore()    → setRendered(min(rendered + size, posts.length))
```

## Component specs

### `TopicPostListItem` (rewrite)

Flex row, single line of content, two-line max on narrow widths via title truncation.

```
[ rank. ]  [ Title text — green, hover:underline ]  ·····  [ ★ 9.3 (9) ]
```

- Wrapper: `<Link to={...} className="group flex items-baseline gap-4 py-3 border-b border-border/60 hover:bg-muted/40 transition-colors">`
- Rank: `<span className="w-8 shrink-0 text-right text-sm text-muted-foreground tabular-nums">{rank}.</span>`
- Title: `<h3 className="flex-1 min-w-0 truncate text-sm md:text-base font-heading font-semibold text-primary group-hover:underline">{displayTitle}</h3>`
- Score: `<span className="shrink-0 flex items-center gap-1 text-xs text-muted-foreground"><Star className="h-3 w-3 fill-secondary text-secondary"/><span className="text-foreground font-semibold">{seedAvg}</span><span>({post.ratingCount})</span></span>`
- Removed from current implementation: border, rounded corners, card bg, chevron, avatar, `@username`, preview line, and the inline `(count)` after the title (deduplicated with the right-side count).

### `TopicPage` header

```tsx
<div className="mb-6 flex items-start justify-between gap-4">
  <div className="min-w-0">
    <div className="flex items-baseline gap-3">
      <h1 className="text-3xl md:text-4xl font-heading font-bold text-card-foreground">
        {topic.name}
      </h1>
      <span className="text-sm text-muted-foreground">/{topic.categoryName}</span>
    </div>
    <p className="mt-1 text-sm text-muted-foreground">
      {getTopicSubtitle(topic.name, topic.categoryName)}
    </p>
  </div>
  <FollowTopicButton topicId={topic.id} />
</div>
```

### `AddPostBar` (restyle)

Change only the trigger's classes. Dialog, `CreatePostDialog`, `useCreatePost`, and submit flow are unchanged.

- From: bordered, rounded card with `px-4 py-3 border rounded-xl bg-card mt-3`
- To: flat row with `flex items-center gap-3 py-3 border-b border-border/60 hover:bg-muted/40 w-full`
- Coral plus icon circle (`bg-secondary text-secondary-foreground`) stays as the leading affordance — coral is acceptable here because it's a decorative icon inside an element whose text label is green. The CTA text becomes `text-primary` (green, per contract).

### `TopicPaginationFooter` (new)

Props:
```ts
{ size: number;
  total: number;
  rendered: number;
  onSizeChange: (size: number) => void;
  onShowMore: () => void; }
```

Layout (left-aligned group + right-aligned group in a single `flex items-center justify-between` row, `mt-6`):

- Left: `Posts View` label (`text-muted-foreground`) + shadcn `Select` with options `10 / 25 / 50 / 100`.
- Right (only when `rendered < total`): `"{total - rendered} more"` in `text-muted-foreground` + `Show more` button styled `text-primary hover:underline text-sm`.
- When `rendered >= total`, the right side renders nothing.

## Pagination behavior

- URL param: `?size=25`. Read via `useSearchParams`. Valid values: `10 | 25 | 50 | 100`. Invalid or missing → default `25`.
- Page-size change: `rendered = max(newSize, currentRendered)`. This never shrinks the user's view (if they've shown 40 posts and switch size from 10→25, they still see 40) but does grow it if the new size is larger than what's rendered.
- On first render, `rendered = min(size, posts.length)`.
- "Show more" sets `rendered = min(rendered + size, total)`. No URL change for show-more clicks (keeps URLs stable for sharing a page-size).
- No scroll restoration logic — append-style keeps the DOM continuous.

## Color contract audit

| Element | Class | Interactive? | Rule satisfied |
| --- | --- | --- | --- |
| Topic title `h1` | `text-card-foreground` | No | Static black ✅ |
| `/CategoryName` | `text-muted-foreground` | No | Static gray ✅ |
| Subtitle question | `text-muted-foreground` | No | Static gray ✅ |
| `FollowTopicButton` | (unchanged) | Yes | Existing component ✅ |
| Row rank `1.` | `text-muted-foreground` | No | Static gray ✅ |
| Row title | `text-primary` + `hover:underline` | Yes (navigates) | Green clickable ✅ |
| Row score digits | `text-foreground` | No | Static black ✅ |
| Row star icon | `text-secondary fill-secondary` | No | Coral for rating only ✅ |
| Row count `(9)` | `text-muted-foreground` | No | Static gray ✅ |
| `Posts View` label | `text-muted-foreground` | No | Static gray ✅ |
| Size `Select` trigger | shadcn default | Yes | Component-level ✅ |
| `Show more` | `text-primary hover:underline` | Yes | Green clickable ✅ |
| `"N more"` counter | `text-muted-foreground` | No | Static gray ✅ |
| `Add your own advice…` CTA text | `text-primary` | Yes | Green clickable ✅ |
| Plus icon circle | `bg-secondary` | No (decorative) | Coral as icon accent inside a green-labeled clickable row — acceptable; the contract governs *text* color |

## Testing

- **Manual, required before shipping**: `npm run dev`, navigate to `/topic/:name` with a topic that has ≥30 posts; confirm:
  1. Header renders with new typography.
  2. Rows are flat, divided, with green titles that navigate on click.
  3. Hover shows `hover:underline` on title and `bg-muted/40` on the row.
  4. Default `?size` is 25; 25 rows render.
  5. Dropdown change to 10/50/100 updates URL and rendered count.
  6. `Show more` appends the next `size` rows; disappears when all rendered.
  7. For topics with ≤ size posts, the pagination footer hides the "Show more" side.
  8. `AddPostBar` trigger renders as a flat row and still opens the existing dialog.
- No unit tests added — this is a visual refactor of existing components that lack tests today.

## Risks

- **Density perception**: removing the preview line and avatar makes rows denser. Mitigation: `py-3` + `border-b border-border/60` is enough breathing room; visually validated by the mockup.
- **Pagination URL collisions**: other query params on the topic page — none today. Future params should coexist.
- **Page-size edge cases**: very small topics (< size) should render "no more" state cleanly. Tested in manual step 7 above.

## Implementation order (hint for the plan)

1. Add `TopicPaginationFooter` component.
2. Update `TopicPage` header markup + pagination state wiring.
3. Rewrite `TopicPostListItem` row layout.
4. Restyle `AddPostBar` trigger.
5. Manual QA per the Testing section.
