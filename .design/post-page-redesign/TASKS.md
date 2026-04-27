# Build Tasks: Post (Subtopic) Page Redesign

Generated from: `.design/post-page-redesign/DESIGN_BRIEF.md` + `INFORMATION_ARCHITECTURE.md` + `DESIGN_TOKENS.css`
Date: 2026-04-27

Each task is a vertical slice (structure + styling + interaction). Tasks are ordered so the editorial aesthetic is visible after the first three so we can course-correct early; the highest-risk decomposition (`TopicPostExpanded`) is bounded by the new components rather than rewritten in one drop.

## Foundation

- [ ] **Merge editorial tokens into `src/index.css`**: Append the additive `:root` and `.dark` declarations from `DESIGN_TOKENS.css` directly into the existing `@layer base { :root { ... } }` and `.dark { ... }` blocks. Do NOT replace any existing variable. Verify nothing breaks by running `npm run dev` and confirming TopicPage still renders. _Establishes Community Editorial token layer; unblocks every subsequent task._

- [ ] **Confirm `TopicPostExpanded` usage scope**: Grep the codebase for `TopicPostExpanded` references. If it's used only by `SubtopicPage.tsx`, we can later delete it after migration. If used elsewhere, leave it alone and just stop using it on the post page. Document the finding inline in `SubtopicPage.tsx` as a one-line comment. _De-risks the decomposition strategy. Reuses: nothing._

- [ ] **Build the page shell `<PostPageLayout>` (or inline in `SubtopicPage.tsx`)**: 3-column CSS grid using token variables — `[var(--rail-width-left) | 1fr | var(--rail-width-right)]` with `var(--rail-gap)` between, middle column capped at `var(--middle-col-max-width)`, page centered with generous outer padding. Mount `TopicRecentlyAdded` in left rail and a placeholder div in middle/right for now. Verify on desktop the body cap actually constrains to ~760px on a 1920px screen. _Reuses: `TopicRecentlyAdded`, `DeetHeader`, `DeetFooter`. New: layout shell._

## Core UI (validates the aesthetic — build in this order so we can check the editorial feel after task 5)

- [ ] **`PostHeader` component**: Breadcrumb (`← Back to {topic} / #{rank}`) + `RankPill` (`#{rank} of {total}`, neutral muted bg, uppercase letter-spacing, no border) + `<h1>` title using `font-heading` + `var(--font-size-post-title)` + `var(--line-height-post-title)` + read-only avg chip (coral star + numeric avg + count, with tooltip "Average rating from N readers"). Must satisfy color contract: only the back-link is green/clickable. Title is `text-card-foreground`. Pill bg is `var(--surface-rank-pill)`, text `var(--surface-rank-pill-text)`. _New component. File: `src/components/post/PostHeader.tsx` and `src/components/post/RankPill.tsx`._

- [ ] **`AuthorByline` component**: Avatar (`UserAvatar`, size sm) + display name (green, links to `/profile/:userId`) + posted date (muted) + optional one-line bio from profile (muted, italic, line-clamp-1). Uses `var(--font-size-byline)` and `var(--line-height-byline)`. Sits under `PostHeader` with `var(--space-rhythm-block)` gap. Wrapped in semantic `<address>`. _New component. Reuses: `UserAvatar`. File: `src/components/post/AuthorByline.tsx`._

- [ ] **`PostBody` component**: Pure prose container constrained to `var(--reading-max-width)`. Uses `prose prose-base max-w-none` with overrides for body size (`var(--font-size-prose-body)`), leading (`var(--line-height-prose-body)`), heading font (Merriweather), link color (green primary). Strip Tailwind prose's default heading sizes for h2/h3 inside body — reset to a sensible serif scale. Renders `post.content` with `whitespace-pre-line` for v1; if/when posts move to rich content, swap source. _New component. File: `src/components/post/PostBody.tsx`._

  > **Aesthetic checkpoint**: After this task, the page should *feel* editorial when viewed on desktop. If it doesn't, stop and revisit before continuing — typography is foundational. Compare side-by-side with the current `TopicPostExpanded` body to confirm the tonal shift.

- [ ] **`RatePostBlock` component**: Section with `id="rate"`, soft accent surface (`var(--surface-rate-block)` bg, `var(--surface-rate-block-border)` 1px border, `--radius` corners, generous padding ~`var(--space-rhythm-block)`). Heading copy: "Was this helpful?" (`<h2>` editorial section size). Sub-copy: "Rate this answer to help others find the best response." (muted, single line). Embeds `<UserRatingIndicator postId={post.id} onRatingChanged={...}>`. **Logged-out variant**: replace the widget with a green "Sign in to rate" link that navigates to `/login?next=:current+#rate`. Sits below `PostBody` with `var(--space-rhythm-section)` gap. _New component. Reuses: `UserRatingIndicator`. File: `src/components/post/RatePostBlock.tsx`._

- [ ] **`PrevNextRankPager` component**: Two-up flex row, each side a `<Link>` showing `←` or `→` arrow + rank number + truncated title (line-clamp-1). Hairline top + bottom borders, no card background. Disabled-but-visible on rank=1 (no left link) and rank=total (no right link), keep layout stable using a placeholder spacer. ARIA labels: "Previous answer: #2 The real cost of daycare" / "Next answer: #4 …". Sits below `RatePostBlock` with `var(--space-rhythm-section)` gap. _New component. File: `src/components/post/PrevNextRankPager.tsx`._

- [ ] **`CommentsSection` component + `CommentItem` light restyle**: Wrapper has `id="discussion"`, `<h2>Discussion ({count})</h2>`, then composer (or sign-in CTA if logged out), then list of `CommentItem`s. Light restyle of `CommentItem`: tighten typography to body sans, replace any heavy left border on nested replies with a hairline `var(--border-prose-divider)` left rule, align avatar with text grid. Composer is the existing `RichTextEditor` wrapped in a clean editorial container (no card, no shadow, just border-bottom). _New `CommentsSection` wrapper at `src/components/post/CommentsSection.tsx`. Modify `src/components/CommentItem.tsx` (visual only, no API change)._

## Right Rail

- [ ] **`RelatedTopicsRail` — adapt `TopicRecommendations` for post-page context**: Verify the existing `TopicRecommendations` component accepts the current topic and excludes it from its own related list. If it doesn't, add a `currentTopicId` prop. Light visual restyle to align with the editorial palette: lighter border (`var(--border-hairline)`), no hover shadow on cards, replace card hover with a subtle `bg-accent/40` background change. Header: "Related Topics" using `var(--font-size-meta)` uppercase muted (mirrors `TopicRecentlyAdded`'s header style). _Modify: `TopicRecommendations`. New thin wrapper if the modify is too invasive: `src/components/post/RelatedTopicsRail.tsx`._

## Page Wiring

- [ ] **Refactor `SubtopicPage.tsx` to compose the new components**: Replace the body of the middle column. Order: `PostHeader → AuthorByline → PostBody → RatePostBlock → PrevNextRankPager → CommentsSection`. Right rail mounts `RelatedTopicsRail` (drop the "Other subtopics in {topic}" `<aside>` ranked list). Drop the hero image block (cowboys hardcode and the `TOPIC_POST_HERO` map). Stop using `TopicPostExpanded` on this route. Drop the standalone breadcrumb row (it's now inside `PostHeader`). Compute `total = posts.length` and pass to `PostHeader`/`PrevNextRankPager`. Pass `previousPost`/`nextPost` to `PrevNextRankPager`. _Modify: `src/pages/SubtopicPage.tsx`._

- [ ] **Delete dead code**: If task 2 confirmed `TopicPostExpanded` is unused after migration, delete `src/components/TopicPostExpanded.tsx`. If still referenced elsewhere, leave it. Either way, the post page no longer imports it. _Cleanup. Modify or delete depending on scope finding._

## Interactions & States

- [ ] **Optimistic rating updates**: When a user rates via `RatePostBlock`'s `UserRatingIndicator`, the header avg chip refreshes via React Query cache invalidation (`["posts-by-topic", topicId]` and any `["ratings", postId]` key). Confirm no full-page re-render; use the existing `onRatingChanged` callback path. Covers states: not-yet-rated → previewing → saved → cleared. _No new components._

- [ ] **Logged-in vs logged-out states across the page**: Verify each interactive surface degrades correctly when `!isAuthenticated`:
  - `RatePostBlock` → "Sign in to rate" link with `?next=...#rate`
  - `CommentsSection` composer → "Sign in to join the discussion" link with `?next=...#discussion`
  - Title, body, author, prev/next pager, related topics, recently added → fully visible
  - Drop the existing `TopicPostExpanded` `Lock` icon paywall card entirely (covered by task 9's refactor; verify removed). _Behavioral verification, no new component._

- [ ] **Hash-anchor scroll behavior on first load**: When the URL contains `#rate` or `#discussion`, the page scrolls smoothly to that section after the post content has finished loading. Use `scrollIntoView({ behavior: 'smooth', block: 'start' })` in a `useEffect` that depends on the post being loaded. Honor `prefers-reduced-motion` (no smooth-scroll if reduced). _Small effect added to `SubtopicPage.tsx`._

## Responsive & Polish

- [ ] **`md` breakpoint (768–1023px)**: Both rails collapse below the body. Stacking order: middle column → `Recently Added` → `Related Topics`. Verify the body still hits ~640px+ for comfortable reading at this size. Remove sticky behavior at this breakpoint (rails are now linear content). _CSS only, in the page shell._

- [ ] **`sm` breakpoint (<768px)**: Pure single-column. `PrevNextRankPager` becomes two stacked full-width buttons (still showing rank + title, line-clamp-1). `RatePostBlock` keeps full width. Touch targets ≥44px on rating widget and pager buttons. Header padding scales down via `px-4` instead of `px-6 lg:px-10`. _CSS only, in the page shell + `PrevNextRankPager`._

- [ ] **Accessibility pass**: Tab order test: header back-link → title (skip target) → byline name → body links → rate widget → prev → next → composer → first comment → … . Verify:
  - `<h1>` is unique on page (the post title), `<h2>` for "Was this helpful?" and "Discussion".
  - All interactive elements have visible focus rings using `--ring`.
  - Rating widget keyboard-accessible (already done in `UserRatingIndicator`).
  - Pager links have descriptive `aria-label`.
  - `<address>` wraps `AuthorByline`, `<article>` wraps each comment.
  - Color contrast: green primary on background passes AA for body text; coral only used on icons + numeric values.
  - `prefers-reduced-motion` honored for hash-scroll and any new transitions. _Cross-cutting verification, no new components._

## Review

- [ ] **Design review**: Run `/design-review` against `.design/post-page-redesign/DESIGN_BRIEF.md`. Capture screenshots at desktop (1280px), tablet (768px), and mobile (375px) widths. Compare to the brief's principles (editorial calm, one job per region, read first / act second) and against the anti-references (Reddit, Quora chrome). Save findings to `.design/post-page-redesign/DESIGN_REVIEW.md`. Address any "must-fix" items inline; defer "nice-to-have" to a follow-up.
