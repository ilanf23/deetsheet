# Topic Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Topic Page middle column as a flat, editorial ranked list with a page-size dropdown + Show more pagination, matching the supplied mockup while preserving DeetSheet's green-for-clickable color contract and the existing 3-column layout.

**Architecture:** Rewrite the row visual in `TopicPostListItem`, add a new `TopicPaginationFooter`, restyle the `AddPostBar` trigger to match the row rhythm, and wire page-size state in `TopicPage` from a `?size=` URL param. No data-layer, route, or hook changes.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind, shadcn/ui (`Select`, `Button`), lucide-react, React Router v6 (`useSearchParams`), TanStack React Query (unchanged).

**Spec:** `docs/superpowers/specs/2026-04-23-topic-page-redesign-design.md`

---

## File Structure

- Create: `src/components/TopicPaginationFooter.tsx` — dropdown + "Show more" + "N more" counter
- Modify: `src/components/TopicPostListItem.tsx` — full visual rewrite, row layout (no card/border/chevron/avatar/preview)
- Modify: `src/components/AddPostBar.tsx` — restyle trigger to flat-row rhythm; dialog flow unchanged
- Modify: `src/pages/TopicPage.tsx` — header layout, pagination state from URL, render `TopicPaginationFooter`

No other files change.

---

## Task 1: Rewrite `TopicPostListItem` as a flat row

**Files:**
- Modify: `src/components/TopicPostListItem.tsx` (full rewrite, ~65 lines today)

- [ ] **Step 1: Replace the entire file contents**

```tsx
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import type { Post } from "@/data/seedData";

interface TopicPostListItemProps {
  post: Post;
  rank: number;
  topicName: string;
}

/**
 * Editorial row used on the topic page. The whole row is a link to the
 * dedicated subtopic page. Shows rank, title (green/clickable), and the
 * rating score on the right.
 */
const TopicPostListItem = ({ post, rank, topicName }: TopicPostListItemProps) => {
  const seedAvg =
    post.ratingCount > 0
      ? Math.round((post.ratingScore / post.ratingCount) * 10) / 10
      : 0;
  const displayTitle = post.title || post.content;

  return (
    <Link
      to={`/topic/${encodeURIComponent(topicName)}/post/${rank}`}
      className="group flex items-baseline gap-4 py-3 border-b border-border/60 hover:bg-muted/40 transition-colors"
    >
      <span className="w-8 shrink-0 text-right text-sm text-muted-foreground tabular-nums">
        {rank}.
      </span>
      <h3 className="flex-1 min-w-0 truncate text-sm md:text-base font-heading font-semibold text-primary group-hover:underline">
        {displayTitle}
      </h3>
      <span className="shrink-0 flex items-center gap-1 text-xs text-muted-foreground">
        <Star className="h-3 w-3 fill-secondary text-secondary" />
        <span className="text-foreground font-semibold">{seedAvg}</span>
        <span>({post.ratingCount})</span>
      </span>
    </Link>
  );
};

export default TopicPostListItem;
```

- [ ] **Step 2: Type-check and lint**

Run: `npm run lint -- src/components/TopicPostListItem.tsx`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/TopicPostListItem.tsx
git commit -m "Redesign TopicPostListItem as editorial row"
```

---

## Task 2: Create `TopicPaginationFooter`

**Files:**
- Create: `src/components/TopicPaginationFooter.tsx`

- [ ] **Step 1: Create the component**

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];
export const DEFAULT_PAGE_SIZE: PageSize = 25;

export const isValidPageSize = (value: number): value is PageSize =>
  (PAGE_SIZE_OPTIONS as readonly number[]).includes(value);

interface TopicPaginationFooterProps {
  size: PageSize;
  total: number;
  rendered: number;
  onSizeChange: (size: PageSize) => void;
  onShowMore: () => void;
}

const TopicPaginationFooter = ({
  size,
  total,
  rendered,
  onSizeChange,
  onShowMore,
}: TopicPaginationFooterProps) => {
  const remaining = Math.max(0, total - rendered);

  return (
    <div className="mt-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Posts View</span>
        <Select
          value={String(size)}
          onValueChange={(value) => {
            const next = Number(value);
            if (isValidPageSize(next)) onSizeChange(next);
          }}
        >
          <SelectTrigger className="h-8 w-[72px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZE_OPTIONS.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {remaining > 0 && (
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">{remaining} more</span>
          <button
            type="button"
            onClick={onShowMore}
            className="text-primary hover:underline font-semibold"
          >
            Show more
          </button>
        </div>
      )}
    </div>
  );
};

export default TopicPaginationFooter;
```

- [ ] **Step 2: Type-check and lint**

Run: `npm run lint -- src/components/TopicPaginationFooter.tsx`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/TopicPaginationFooter.tsx
git commit -m "Add TopicPaginationFooter component"
```

---

## Task 3: Restyle `AddPostBar` trigger as flat row

**Files:**
- Modify: `src/components/AddPostBar.tsx` (trigger markup only, lines 40–47 today)

- [ ] **Step 1: Replace only the `DialogTrigger` button markup**

Find the current trigger:

```tsx
<DialogTrigger asChild>
  <button className="w-full flex items-center gap-3 px-4 py-3 border rounded-xl bg-card hover:bg-muted/50 transition-colors cursor-pointer mt-3">
    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-orange-500 text-white shrink-0">
      <Plus className="w-4 h-4" />
    </div>
    <span className="text-sm text-muted-foreground">Add your own advice or perspective!</span>
  </button>
</DialogTrigger>
```

Replace with:

```tsx
<DialogTrigger asChild>
  <button
    type="button"
    className="w-full flex items-center gap-3 py-3 border-b border-border/60 hover:bg-muted/40 transition-colors cursor-pointer"
  >
    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-secondary text-secondary-foreground shrink-0 ml-0">
      <Plus className="w-4 h-4" />
    </div>
    <span className="text-sm font-semibold text-primary">
      Add your own advice or perspective!
    </span>
  </button>
</DialogTrigger>
```

Leave all other code in `AddPostBar.tsx` unchanged (state, `handleSubmit`, `Dialog`, `CreatePostDialog`, `useCreatePost`, toast).

- [ ] **Step 2: Type-check and lint**

Run: `npm run lint -- src/components/AddPostBar.tsx`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/AddPostBar.tsx
git commit -m "Restyle AddPostBar trigger to flat row"
```

---

## Task 4: Rework `TopicPage` — header, pagination state, footer

**Files:**
- Modify: `src/pages/TopicPage.tsx` (imports, header, list rendering, footer)

- [ ] **Step 1: Update imports**

At the top of the file, change:

```tsx
import { useMemo } from "react";
import { useParams } from "react-router-dom";
```

to:

```tsx
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
```

Then add this import below the other component imports:

```tsx
import TopicPaginationFooter, {
  DEFAULT_PAGE_SIZE,
  isValidPageSize,
  type PageSize,
} from "@/components/TopicPaginationFooter";
```

- [ ] **Step 2: Add pagination state inside the `TopicPage` component**

Immediately after the existing `const posts = useMemo<Post[]>(...)` block, add:

```tsx
const [searchParams, setSearchParams] = useSearchParams();
const sizeFromUrl = Number(searchParams.get("size"));
const size: PageSize = isValidPageSize(sizeFromUrl) ? sizeFromUrl : DEFAULT_PAGE_SIZE;

const [rendered, setRendered] = useState<number>(() =>
  Math.min(size, posts.length || size)
);

// Keep `rendered` in sync when posts load/change for the first time.
useEffect(() => {
  setRendered((prev) => Math.min(Math.max(prev, size), posts.length || size));
}, [posts.length, size]);

const visiblePosts = useMemo(() => posts.slice(0, rendered), [posts, rendered]);

const handleSizeChange = (next: PageSize) => {
  const nextParams = new URLSearchParams(searchParams);
  nextParams.set("size", String(next));
  setSearchParams(nextParams, { replace: true });
  setRendered((prev) => Math.max(prev, next));
};

const handleShowMore = () => {
  setRendered((prev) => Math.min(prev + size, posts.length));
};
```

- [ ] **Step 3: Replace the header block**

Find:

```tsx
<div className="mb-6">
  <div className="flex items-start justify-between gap-4">
    <div>
      <h1 className="text-2xl font-bold text-card-foreground font-heading">{topic.name}</h1>
      <p className="text-sm text-muted-foreground">/{topic.categoryName}</p>
      <p className="text-sm text-muted-foreground mt-1">{getTopicSubtitle(topic.name, topic.categoryName)}</p>
    </div>
    <FollowTopicButton topicId={topic.id} />
  </div>
</div>
```

Replace with:

```tsx
<div className="mb-6 flex items-start justify-between gap-4">
  <div className="min-w-0">
    <div className="flex items-baseline gap-3">
      <h1 className="text-3xl md:text-4xl font-heading font-bold text-card-foreground">
        {topic.name}
      </h1>
      <span className="text-sm text-muted-foreground">
        /{topic.categoryName}
      </span>
    </div>
    <p className="mt-1 text-sm text-muted-foreground">
      {getTopicSubtitle(topic.name, topic.categoryName)}
    </p>
  </div>
  <FollowTopicButton topicId={topic.id} />
</div>
```

- [ ] **Step 4: Replace the list rendering and add the footer**

Find:

```tsx
<div className="space-y-2">
  {posts.map((post, i) => (
    <TopicPostListItem
      key={post.id}
      post={post}
      rank={i + 1}
      topicName={topic.name}
    />
  ))}
</div>
{!loading && !!user && topic && (
  <AddPostBar
    topicId={topic.id}
    topicName={topic.name}
    categoryName={topic.categoryName}
    onPostAdded={refreshPosts}
  />
)}
```

Replace with:

```tsx
<div>
  {visiblePosts.map((post, i) => (
    <TopicPostListItem
      key={post.id}
      post={post}
      rank={i + 1}
      topicName={topic.name}
    />
  ))}
  {!loading && !!user && topic && (
    <AddPostBar
      topicId={topic.id}
      topicName={topic.name}
      categoryName={topic.categoryName}
      onPostAdded={refreshPosts}
    />
  )}
</div>
<TopicPaginationFooter
  size={size}
  total={posts.length}
  rendered={rendered}
  onSizeChange={handleSizeChange}
  onShowMore={handleShowMore}
/>
```

- [ ] **Step 5: Type-check and lint**

Run: `npm run lint -- src/pages/TopicPage.tsx`
Expected: no errors.

Run: `npm run build`
Expected: build succeeds (no TS errors).

- [ ] **Step 6: Commit**

```bash
git add src/pages/TopicPage.tsx
git commit -m "Rework TopicPage header and add pagination state"
```

---

## Task 5: Manual QA in the browser

**Files:** (none — verification only)

- [ ] **Step 1: Start dev server**

Run: `npm run dev`
Expected: server listens on port 8080.

- [ ] **Step 2: Visit a topic with many posts**

Open: `http://localhost:8080/topic/<some-topic-name>` (pick any topic with ≥ 30 posts; if none exist, reduce the test threshold to whatever's largest).

- [ ] **Step 3: Header check**

Verify:
- Topic name renders in large heading font with `/Category` inline next to it.
- Subtitle question renders below in muted gray.
- `FollowTopicButton` renders right-aligned on the same row.

- [ ] **Step 4: Row rhythm check**

Verify:
- Rows are flat (no card border, no rounded corners).
- Thin divider between rows.
- Rank number is muted gray, right-aligned in a narrow column.
- Title is green, with a hover underline.
- Score on the right shows coral star + number + `(N)`.
- Clicking a row navigates to `/topic/<name>/post/<rank>`.

- [ ] **Step 5: Pagination check**

Verify:
- Default shows 25 rows; URL shows `?size=25` is not required (default works without the param) and setting `?size=25` keeps 25.
- Change dropdown to `10` → URL becomes `?size=10`; rendered count stays ≥ previous (does not shrink below what was shown).
- Change dropdown to `100` → URL becomes `?size=100`; rendered count jumps up to 100 (or total, whichever is smaller).
- Click `Show more` with `size=25` → rendered count grows by 25 each click.
- When all posts are rendered, the right-side ("N more" + "Show more") disappears.
- Refreshing the page preserves `?size=`.

- [ ] **Step 6: AddPostBar check (signed-in)**

Verify (as a signed-in user):
- Trigger renders as a flat row below the list (no card border).
- Coral plus icon on left.
- `Add your own advice or perspective!` text is green and bold.
- Clicking opens the existing `CreatePostDialog`.
- Submitting a post still creates it and refreshes the list.

- [ ] **Step 7: Color contract audit**

Walk through the middle column and confirm:
- Every green text string is clickable (rank is NOT green, score digits are NOT green).
- No black text wraps a link.
- Coral is only used on rating icons/values and the decorative plus icon inside the green-labeled add-post row.

- [ ] **Step 8: Commit if any QA-driven fixes were made**

If steps 3–7 surfaced issues, fix them in the relevant file and commit separately with a descriptive message. If no issues, no commit needed.

---

## Self-Review Notes

- **Spec coverage:** Each spec section maps to a task — row rewrite (Task 1), pagination footer (Task 2), AddPostBar restyle (Task 3), header + state wiring (Task 4), manual QA per the Testing section of the spec (Task 5).
- **No placeholders.** All code is inline; no "TBD" or "similar to above".
- **Type consistency:** `PageSize`, `DEFAULT_PAGE_SIZE`, `isValidPageSize` exported from `TopicPaginationFooter.tsx` and imported by `TopicPage.tsx`. `handleSizeChange` accepts `PageSize` matching the component's `onSizeChange` prop.
- **Out-of-scope items (per spec):** inline rating picker, participant-avatar cluster, numbered pager, black clickable titles — none included, as intended.
