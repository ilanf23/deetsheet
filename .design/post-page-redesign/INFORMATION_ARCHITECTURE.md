# Information Architecture: Post (Subtopic) Page

**Scope:** the structural skeleton of the redesigned `/topic/:topicName/post/:rank` route and its connections to surrounding pages. This document does not redesign sitewide IA — it locks in the internal IA of one page and respects existing routes registered in `src/App.tsx`.

## Site Map

Existing routes shown for context. The redesign affects one route (★) and changes the *outbound* links from it; no new routes are added.

- Home `/`
- Topics directory `/topics`
- Topic page `/topic/:topicName`
  - **Post page `/topic/:topicName/post/:rank`** ★ *(this redesign)*
- Profile view `/profile` and `/profile/:userId`
- Profile edit `/profile/edit`
- Auth: `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/auth/callback`
- Static: `/about`, `/faq`, `/contact`, `/terms`, `/privacy`
- Admin: `/admin/*` (out of scope)
- 404: `*`

**Outbound links from the redesigned post page** (concrete navigation surfaces):
- `← Back to {topic}` → `/topic/:topicName`
- Author display name → `/profile/:userId`
- Prev/next pager → `/topic/:topicName/post/:rank±1`
- Related-topics rail items → `/topic/:otherTopicName`
- "Sign in to rate" CTA (logged-out) → `/login?next=/topic/:topicName/post/:rank`

## Navigation Model

- **Primary navigation**: Site-level — handled by `DeetHeader` (search, profile menu, admin link). Unchanged by this redesign.
- **Secondary navigation (page-scoped)**: Two coexisting forms:
  1. **Breadcrumb** at the top of the middle column — `← Back to {topic}  /  #{rank}`. Single line, small. Replaces the current standalone back-link row.
  2. **Prev/Next ranked pager** at the foot of the post body — `← #{rank-1} {prev title}` | `#{rank+1} {next title} →`. The only in-page nav between sibling answers.
- **Utility navigation**: `PostActionMenu` overflow (share / report) sits inline with the rate block, not in the page chrome. Keeps it discoverable but not chrome-noisy.
- **Mobile navigation**: `DeetHeader` already collapses on mobile (assumed unchanged). The page itself collapses to a single column; the prev/next pager becomes two stacked full-width buttons; both rails move below the body in this order: Recently Added → Related Topics.

## Content Hierarchy

The page has three regions. Each region has a single job (per Brief principle #2). Content priority is enumerated within each.

### Middle column — the read (priority 1)

This is where 80% of the user's attention lives. Strict top-to-bottom order:

1. **Breadcrumb** — `← Back to {topic} / #{rank}`. Smallest type on the page. Orientation only.
2. **RankPill** — `#{rank} of {total}`. Quiet pill. Establishes ranking context once.
3. **Title (`<h1>`)** — Merriweather serif, bold, large. The dominant element on first paint.
4. **Avg-rating chip** — Inline with breadcrumb cluster or directly under the title — small, coral star + numeric avg + count. Read-only. Functions like a Medium "X claps" indicator.
5. **AuthorByline** — Avatar + display name + posted date + optional one-line bio. Trust signal between title and body.
6. **PostBody** — The essay. `prose` typography, ~720px max-width, generous leading. Consumes the most vertical space.
7. **RatePostBlock** — Section with copy "Was this helpful? Rate this answer" + embedded `UserRatingIndicator`. The primary CTA — placed *after* the read.
8. **PrevNextRankPager** — Two-up ranked sibling navigation. Lightweight; lives between the rate block and the comments to give a clean off-ramp before commit-to-comment territory.
9. **CommentsSection** — `<h2>Discussion ({count})` + composer (logged-in only) + threaded list of `CommentItem`s. The page's secondary engagement surface.

### Left rail — site activity (priority 2)

Single block, sticky within the column on `lg+`.

1. **TopicRecentlyAdded** — Existing component, content unchanged. Header says "Recently Added"; below it is a list of recent posts in the current topic, each rendered as a `PostCard`.

### Right rail — topic discovery (priority 3)

Single block, sticky within the column on `lg+`.

1. **RelatedTopicsRail** — `TopicRecommendations` component (the same one used on the topic page). Header says "Related Topics"; below it is a list of topic cards (image + name + category) linking to other topics. Filters the current topic out of its own related list.

### Below the fold (mobile only)

On `<md`, the rails appear in this stacked order *below* the comments section: `Recently Added` then `Related Topics`. Reasoning: the user has already finished reading and commenting; the rails are now act-2 discovery, not orientation.

## User Flows

The four critical paths. Each is a sequence with decision points.

### Flow 1 — Read a ranked answer (primary, ~70% of sessions)

1. User lands on `/topic/parent/post/3` (from topic page or external share)
2. User sees breadcrumb + rank pill + title + byline at top of middle column
3. User reads the body
4. User reaches the foot of the body and sees `RatePostBlock`
   - **If logged in** → user hovers the rating widget → popover opens → user clicks a star → rating saved → optimistic update of header avg chip
   - **If logged out** → user sees "Sign in to rate this answer" link → clicks → `/login?next=…` → returns to the same post on success
5. User scrolls past rate block to prev/next pager
   - Clicks → routes to next ranked answer in the same topic (Flow 1 repeats)
   - OR ignores → continues into comments section (Flow 2) OR scrolls right rail for related topics (Flow 3) OR leaves

### Flow 2 — Read and discuss

1. Steps 1–3 from Flow 1
2. User scrolls past `RatePostBlock` and `PrevNextRankPager` into `CommentsSection`
3. User reads the existing comments
4. User decides to comment
   - **If logged in** → focuses the TipTap composer → types → submits → comment appears optimistically
   - **If logged out** → sees "Sign in to join the discussion" inline where the composer would be → clicks → `/login?next=…#discussion`

### Flow 3 — Land, abandon-to-discovery

1. User lands on `/topic/parent/post/3` from a search-result share
2. User skims title and first paragraph, decides this isn't the answer they wanted
3. User glances at right rail → sees a related topic that interests them → clicks → leaves to `/topic/:other`
4. (Edge case) On mobile this rail is below the fold; the user hits the prev/next pager first or `← Back to topic` instead

### Flow 4 — Author-trust check

1. User reads title + first paragraph
2. User stops to evaluate the author → eye moves to `AuthorByline` directly under the title
3. User clicks display name → lands on `/profile/:userId`
4. User returns via browser back → reading state preserved (no re-render of body, scroll position kept)

## Naming Conventions

Lock the lexicon. Pick one word and use it everywhere in UI copy.

| Concept | Label in UI | Notes |
|---|---|---|
| The page itself | "Answer" / "Post" interchangeably in code; **"Answer" in user-facing copy** when referring to the body, **"Post" in metadata** (e.g., "Posted by", "Post #3"). Avoid "Subtopic" in UI — it's an implementation noun, not a reader's word. |
| The thing the topic asks | "Question" (implicit; usually phrased as the topic subtitle) | Don't surface the word "Subtopic" anywhere. |
| Position in the ranking | "#3" (numeric, with leading hash) for short references; "Rank 3 of 18" inside the `RankPill` | Never "Position 3", "Place 3", or "Spot 3". |
| The sum of ratings | "Average rating" in tooltips, "X.X" + count in chip | Not "score", not "rating index". |
| The personal rating action | "Rate this answer" on the foot block; tooltip "Your rating" on the trigger | Don't say "Vote" — it's not a vote. |
| Comments | **"Discussion"** in section headers; **"Comments"** acceptable in prose (e.g., "12 comments"). | Pick "Discussion" for the heading because it sets a tone aligned with the editorial principle; "Comments" remains in inline counts only. |
| The body | "The post" / "this answer" in CTAs ("Was this helpful? Rate this answer.") | Be consistent: refer to the body as "this answer" in CTAs to reinforce the read-first frame. |
| The author | "Posted by **{display name}** · {date}" | Not "By", not "Author:". |
| Related topics rail | **"Related topics"** | Not "More like this", not "You might like". |
| Activity feed (left rail) | **"Recently added"** | Existing label; keep verbatim. |
| The previous/next pager | **"Previous answer"** / **"Next answer"** in `aria-label`; visible label is just `← #2 {title}` / `#4 {title} →` | Visible label optimizes for skimming. |

## Component Reuse Map

Structural components shared across this page and others.

| Component | Used on | Behavior differences |
|---|---|---|
| `DeetHeader` | All pages | None — used as-is. |
| `DeetFooter` | All pages | None — used as-is. |
| `TopicRecentlyAdded` | Topic page, **Post page (left rail)** | Same content/component. May have a small visual class change to align with the editorial card style (lighter borders). |
| `TopicRecommendations` | Topic page (right rail), **Post page (right rail)** | Same component. Must accept the *current topic* as input so it can exclude it from its own related list. If it doesn't currently — that's a small modify. |
| `UserRatingIndicator` | Topic page rows, `PopularTopicSection`, **Post page `RatePostBlock`** | Used as-is. The post page uses it inside a labeled foot-of-body callout. |
| `PostActionMenu` | Topic page, **Post page** | Used as-is. Anchored next to the rate block. |
| `RichTextEditor` (TipTap) | Comment composer everywhere it appears | No change. |
| `CommentItem` | Anywhere comments render | Light visual restyle (typography, hairline nesting border) — same data API. |
| `UserAvatar` | Anywhere a user's avatar shows | No change. |
| New: `PostHeader`, `RankPill`, `AuthorByline`, `PostBody`, `RatePostBlock`, `PrevNextRankPager` | **Post page only** | Single-purpose. None duplicate something that already exists; the brief's component inventory verifies this. |

## Content Growth Plan

What grows, and how the IA accommodates that growth.

- **Comments** — unbounded. Today the page renders all top-level comments (`getCommentsByPost(post.id)`) inline. As popular posts accumulate hundreds of comments, this will become a perf and readability problem.
  - *Short term (in this redesign)*: render all comments; visually it's still fine for the typical 0–30 range.
  - *Future*: paginate after ~25 ("Load more discussion"); server-side sort; collapse-on-thread-depth >2. Out of scope for this brief but the `CommentsSection` API should leave room for it (accept a `limit` prop, render a "Load more" button when the underlying query truncates).
- **Comment threads (depth)** — `CommentItem` already renders nested replies via its own logic (per existing code). No structural change.
- **Sibling answers (rank N)** — bounded by the topic's posts (today usually <30, ranked client-side by `average_rating`). The prev/next pager handles up to whatever exists. If `rank == 1`, hide the previous half. If `rank == total`, hide the next half. Both edges visible-but-disabled is also acceptable; choose disabled+visible for layout stability.
- **Related topics** — `TopicRecommendations` already handles its own ranking/limit. No change here.
- **Recently added** — `TopicRecentlyAdded` already limits to 5 posts (`useRecentPostsByTopic(topicId, 5)`). No change.

## URL Strategy

Existing route is preserved verbatim — the redesign is purely visual/structural.

- **Pattern**: `/topic/:topicName/post/:rank`
  - `:topicName` is the URL-encoded display name (matches what `TopicPage` and `TopicPostListItem` already construct)
  - `:rank` is a 1-indexed integer (the post's position in the topic's ranked list)
- **Dynamic segments**: just the two above
- **Query parameters** (additive, all optional):
  - `?from=topic` / `?from=share` / `?from=related` — provenance hint, used to tune the breadcrumb back-link's label or — in a later pass — to select what to highlight in the right rail. **Not implemented in v1**, but reserve the param name now to avoid future churn.
  - `?ref=:userId` — referrer for share attribution. Not consumed by the page, but preserved through navigation. Out of scope to implement in this brief.
- **Hash anchors** (used by intra-page links and screen-reader skip targets):
  - `#discussion` — scroll target for the comments section heading
  - `#rate` — scroll target for the `RatePostBlock` heading
  - These are stable IDs the page must render. Used by:
    - The "Sign in to join the discussion" return URL (`/login?next=…#discussion`)
    - Future "Skip to rate" / "Skip to discussion" affordances
    - Comment permalinks (out of scope for v1, but ID stability matters for future work)
- **State NOT in the URL**:
  - The personal rating value (server-side per user)
  - The comment composer draft (client-side, ephemeral)
  - The expansion state of any comment thread (ephemeral; threads are visible by default)
- **Login round-trip**: Any auth-required CTA constructs the next-URL as the current full path including hash, so `/login?next=/topic/parent/post/3#rate` round-trips the user back to the exact context. This is a lightweight convention, not a routing change.
