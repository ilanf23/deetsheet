# Design Brief: Post (Subtopic) Page Redesign

**Route:** `/topic/:topicName/post/:rank`
**Primary file:** `src/pages/SubtopicPage.tsx` (and the components it composes — chiefly `TopicPostExpanded.tsx`)

## Problem

The current Post page is a structurally noisy hybrid of three patterns at once: it tries to be a Reddit ranked entry, a Quora answer, and a Medium essay simultaneously. The body is squeezed between two competing rails, the rating widget sits in three different places, the author identity is buried in a footer line, and the right-side "Other subtopics" rail duplicates the topic page's job. The result: long-form opinion content (which is what users actually post) is hard to read, the author has no presence, and the call-to-action ("rate this") is lost in chrome.

A reader landing on a ranked answer should be able to: (a) immediately understand they're reading rank #N of M, (b) get into the body with no friction, (c) know who wrote it and weigh their credibility, (d) finish reading and rate it without hunting, and (e) decide whether to read another ranked answer or jump to a related topic — all without the page fighting them.

## Solution

A 3-column editorial layout in which each region has a single, non-overlapping job: the **left rail** signals site-wide activity (Recently Added — what the community is doing), the **middle column** is a calm long-form reader (post → author → body → rate-this CTA → comments) with a slim prev/next ranked pager at the foot, and the **right rail** surfaces topic discovery (Related Topics — where to go next after this read). The post becomes a first-class editorial object instead of a list-item-that-expanded.

The middle column is treated as an article: generous reading width (~720–760px), Merriweather serif title, comfortable line-height, real article rhythm. Rank context is shown *once* — as a pill near the title — not as a giant "1." badge that competes with the headline. Author gets a proper byline. Rating splits cleanly into a small read-only avg chip in the header (informational, like a clap count) and a prominent "Was this helpful? Rate it" block at the foot of the body just before comments (single source of truth for the personal `UserRatingIndicator`). Comments live below the rate block as a clearly-sectioned discussion.

## Experience Principles

Three principles, each resolves a tension. Every design decision rolls up to one of these.

1. **Editorial calm over community noise** — Long-form opinion deserves the rhythm of an essay, not the visual density of a forum thread. When in doubt, remove a chrome element rather than add one. Whitespace is a feature.
2. **One job per region** — Left = site activity. Middle = read this answer. Right = discover related topics. No region steals attention from the middle column. Anything that doesn't serve its region's single job gets cut.
3. **Read first, act second** — The CTA to rate, comment, share, or jump appears *after* the read, not before. The header is signal-only (rank, title, avg, author). The foot is action-only (rate, prev/next, comments).

## Aesthetic Direction

- **Philosophy**: **Community Editorial** — a Substack/Medium reading rhythm anchored by an existing community-software identity. Specifically: serif Merriweather headlines (already in tokens), generous vertical breathing, narrow article column, warm off-white surfaces, green as the only navigation accent (signals "clickable"), coral reserved exclusively for ratings (signals "this is a rating value"). High typographic contrast between heading (serif, bold) and body (sans, regular). Subtle borders, no heavy cards, no drop-shadows on the article body itself.
- **Tone**: Considered. Warm but quiet. The voice of a thoughtful editor presenting a contributor's piece, not a frenetic feed.
- **Reference points**:
  - **Substack post page** (typography rhythm, narrow column, foot-of-body CTAs)
  - **NYT Opinion / The Atlantic** (serif headline, sans body, byline treatment)
  - **Stratechery** (clean reading column with a quiet right rail)
  - **Lobste.rs comment threads** (dense but readable comment hierarchy without Reddit's collapsed/upvote noise)
- **Anti-references**:
  - **Reddit / old-Reddit** — no ranked column on the side, no compressed visual density, no upvote arrow drawing the eye away from the title
  - **Quora** — no over-prominent author cards with follow-buttons everywhere; the byline is small and supportive, not an interruption
  - **Medium's clap-paywall chrome** — no sticky floating action bars, no engagement nags
  - **Dashboard SaaS** — no card-stack-of-equal-weight blocks; the body must dominate

## Existing Patterns

Everything in the brief extends what's already in the codebase. No replacement of tokens. No introduction of new third-party UI libraries.

- **Typography**: `Merriweather` (weights 400/700/900) for headings via `font-heading`; system sans (`ui-sans-serif, system-ui, …`) for body via `font-body`. Fonts already loaded in `src/index.css`.
- **Colors** (HSL CSS vars in `:root`):
  - `--background 0 0% 98%` (warm off-white) / `--card 0 0% 100%`
  - `--foreground 220 20% 14%` (near-black with a touch of blue) / `--muted-foreground 220 10% 46%`
  - `--primary 157 60% 30%` (deep green) — interactive text + nav accents
  - `--secondary 20 100% 60%` (coral/orange) — ratings only
  - `--accent 157 60% 95%` (pale green wash) — hover surfaces, soft callouts
  - `--border 220 13% 91%` — hairline dividers
  - Dark mode tokens defined but not currently rendered by the app (pages hardcode `bg-white`); out of scope for this redesign.
- **Spacing**: Tailwind default scale. Heavy use of `gap-3/4/5`, `px-3 py-3.5`, `rounded-xl` on cards. Container `--radius: 0.75rem`.
- **Color contract (strict, from CLAUDE.md)** — must respect:
  - Green `text-primary` = clickable text (always navigable)
  - Black/dark `text-foreground` / `text-card-foreground` = static copy
  - Gray `text-muted-foreground` = secondary supporting copy
  - Coral `text-secondary` = rating values and rating icons only
- **Components to reuse as-is**:
  - `DeetHeader`, `DeetFooter` (page chrome)
  - `UserAvatar` (avatar with username)
  - `UserRatingIndicator` (hover-popover personal rating; the single source of truth)
  - `CommentItem` (comment renderer; may get light visual restyle)
  - `RichTextEditor` (TipTap-based comment composer)
  - `PostActionMenu` (overflow menu for share/report)
  - `TopicRecentlyAdded` (left rail — content stays as today)
  - `TopicRecommendations` (currently used on TopicPage right rail — reused for this page's right rail)
  - shadcn/ui primitives: `Button`, `Popover`, `Dialog`, etc.
- **Components to refactor or replace**:
  - `TopicPostExpanded` is the current monolith. It has two modes (expanded/collapsed) baked in for the topic page's old expand-in-place pattern. For the post page, it gets *split* into purpose-built building blocks listed in the inventory below. The collapsed mode is no longer needed on this route (we are always expanded).
- **Components to delete from the post page** (may stay on other pages):
  - The "Other subtopics in {topic}" right-rail list — replaced by `TopicRecommendations` (related topics, not other posts).

## Component Inventory

| Component | Status | Notes |
|---|---|---|
| `PostHeader` | **New** | Container for breadcrumb, rank pill, title, avg-rating chip. Replaces the title-row of the current `TopicPostExpanded`. |
| `RankPill` | **New** | Small pill: `#3 of 18`. Sits directly above the title. Coral-bordered? No — neutral border, just a quiet orientation chip. Not clickable. |
| `AuthorByline` | **New** | Avatar + display name (green, links to profile) + posted date + optional one-line bio from profile. Sits directly under title. |
| `PostBody` | **New** | Pure long-form prose container. `prose` class with editorial overrides: serif headings, generous leading, narrow max-width (~720px). Replaces the body section of `TopicPostExpanded`. |
| `RatePostBlock` | **New** | Foot-of-body callout with copy ("Was this helpful? Rate this answer.") and an embedded `UserRatingIndicator`. Single source of truth for personal rating on this page. |
| `PrevNextRankPager` | **New** | Slim two-up navigation: `← #2 The real cost of daycare` on left, `#4 Co-parenting strategies →` on right. Lives between `RatePostBlock` and `CommentsSection`. |
| `CommentsSection` | **Modify** | Wrapper around the existing `RichTextEditor` composer + list of `CommentItem`. Section header "Discussion (N)". Editorial vertical rhythm matching the body. |
| `CommentItem` | **Modify (light)** | Tighter typography, hairline left rule for nesting (replace any heavy borders), avatar + name aligned with body's text grid. |
| `RelatedTopicsRail` | **Reuse `TopicRecommendations`** | Right rail content. May need a small visual tweak to match the editorial palette (lighter borders, no shadows on hover). Verify it renders sensibly without the topic-page context. |
| `BackToTopicLink` | **Modify** | Existing breadcrumb at top of page (`← Back to {topic}` / `#3`) gets condensed into `PostHeader` instead of being a separate top-level row. |
| `TopicRecentlyAdded` | **Reuse as-is** | Left rail. No content/structure change; only a possible rounded-corner/border adjustment to match the editorial card style elsewhere on the page. |
| `TopicHeroImage` | **Modify** | Current hero image only renders for the `cowboys` topic (hardcoded). Either (a) extend to all topics with an image, sized smaller and treated as part of the post header (not full-bleed banner) or (b) drop entirely from the post page since the topic image already lives on the topic page. **Decision: drop from the post page.** Hero distracts from "read this answer". |
| Old `TopicPostExpanded` interaction icons row (thumbs/check/heart/flag) | **Remove from post page** | The interactions were a Reddit-style holdover from the topic-page expand pattern. Personal rating + comment = the only meaningful actions. Flag is preserved in `PostActionMenu` overflow. |

## Key Interactions

State changes, transitions, and feedback. Every interaction obeys the color contract.

- **Page load (logged-in)**: Body renders immediately with skeleton avg-chip and skeleton author bio if those fetch separately. No layout shift when ratings/profile resolve.
- **Page load (logged-out)**: Body fully visible (no paywall) but `RatePostBlock` shows a quiet "Sign in to rate this answer" link instead of the personal widget. The current "Want the full deet?" lock-out card on `TopicPostExpanded` is **removed** — it's overly aggressive and contradicts the editorial calm principle. Comments still readable; comment composer is replaced with a sign-in CTA.
- **Hover the avg-rating chip in header**: Light tooltip showing "Average rating from N readers" — no interaction beyond that. Chip is *not* a button.
- **Hover/click rating widget in `RatePostBlock`**: Existing `UserRatingIndicator` behavior — popover with 10 stars, click to save, X to clear. Rating saved → optimistic UI update on the chip in the header (avg recomputes via React Query invalidation of `["ratings", postId]` and the page's `["posts-by-topic", topicId]`).
- **Click prev/next pager**: Client-side route navigation to `/topic/:name/post/:rank-1` or `:rank+1`. Page scrolls to top. No transition animation in v1; revisit if jarring.
- **Submit a comment**: Existing TipTap composer flow. On success, comment appears optimistically at top of `CommentsSection`. Composer clears.
- **Click a related-topic in right rail**: Standard route navigation to that topic's page.
- **Keyboard**: Tab order = header link → body → rate widget → prev pager → next pager → comment composer → individual comments. All focus rings use `--ring` (green).

## Responsive Behavior

| Breakpoint | Behavior |
|---|---|
| **`lg` and up (≥1024px)** | Full 3-column grid: `[~260px | 1fr (max ~760px) | ~280px]` with `gap-6`. Centered in viewport with generous outer padding. Both rails are sticky-on-scroll within their column. |
| **`md` (768–1023px)** | Right rail (Related Topics) collapses below the body as a horizontal-scroll strip of related-topic cards. Left rail (Recently Added) stays as a column on the left at narrower width (~220px) OR also collapses below the body — pick whichever leaves the body at ~640px+. Recommended: collapse both rails below the body for consistency. |
| **`sm` and below (<768px)** | Pure single-column. Header, byline, body, rate block, prev/next pager (stacked vertically as two full-width buttons), comments, then Recently Added, then Related Topics. No floating action bar. Body uses near-full viewport width with comfortable horizontal padding. |

The middle column **never** exceeds ~760px regardless of viewport — even on a 1920px display, line length stays in the optimal reading range. Excess viewport width becomes outer whitespace.

## Accessibility Requirements

- **Color contrast**: All text meets WCAG AA. Green `--primary 157 60% 30%` against `--background 0 0% 98%` already passes for body-size text. The rating coral `--secondary 20 100% 60%` is **not** used for body text — only for icons and numeric rating values, which are non-essential information also conveyed by the star shape and the avg/count chip.
- **Focus management**: Visible focus ring on every interactive element using the existing `--ring` variable. The `RatePostBlock` heading is the natural skip-target after reading; consider an `id` anchor (`#rate`) so a future keyboard skip-link could jump there.
- **Keyboard**: Prev/next pager is a real `<a>` (or `<button>` with `useNavigate`) — Enter activates. Rating widget is already keyboard-accessible via the existing `UserRatingIndicator`.
- **Screen reader**: Title is `<h1>`. Author byline uses semantic `<address>` for the author block. Comments section header is `<h2>`. Each comment is `<article>`. Prev/next pager links have descriptive `aria-label` ("Previous ranked answer: #2 The real cost of daycare").
- **Motion**: No autoplay, no involuntary movement. The existing `motion/react` star-bounce animation in `UserRatingIndicator` respects user intent (only fires on hover/click). Add `prefers-reduced-motion` guard if the brief surfaces any new animation in implementation.

## Out of Scope

Explicitly **not** part of this redesign — defer to a separate effort:

- Dark mode wiring. Tokens exist but pages currently hardcode `bg-white`. Fixing the hardcoding everywhere is its own project.
- The topic page (`TopicPage.tsx`) layout — already redesigned in the prior conversation (rating-on-row, image-right). Not touched here beyond making sure prev/next pager destinations use the same routes.
- The home feed and any non-post pages.
- Profile pages — the byline links to a profile route but redesigning that route is separate.
- Comment threading depth/sort/moderation — UX of comments themselves is light-touch only (visual restyle); behavior unchanged.
- Real-time updates (websocket comments, etc.).
- Sharing flows beyond the existing `PostActionMenu`.
- Mobile floating action bar / sticky CTA — explicitly avoided per Anti-references.
- Image hero strip on the post page — explicitly cut (decision in inventory above).
- Internationalization / RTL — not currently supported anywhere in the app.
