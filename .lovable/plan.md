# Add 5–10 realistic comments to every subtopic

## The problem (two layers)

1. **Database**: There are 22,700 posts but **0 comments** in the `comments` table. The seed-posts edge function has comment-seeding logic, but it's never been run successfully against the current post set.
2. **Frontend**: `src/components/post/CommentsSection.tsx` reads from the local `seedData.ts` array (`getCommentsByPost`) — which only contains ~26 hardcoded comments tied to fake numeric post IDs (`"3"`, `"11"`, etc.). Real Supabase posts have UUID IDs, so even if the local array had comments, none would match. Every subtopic page currently shows "No comments yet."

We have to fix both, otherwise seeding does nothing visible.

## What will be built

### 1. Rework comment seeding in the edge function

Update `supabase/functions/seed-posts/index.ts` so that running it in `comments` mode:

- Produces **5 to 10 comments per post** (currently 3–5).
- Uses a much richer pool of generic comment templates that read like a real discussion thread — different voices (skeptic, expert, beginner, storyteller, contrarian), and templates that **build on each other** by referencing the post or earlier ideas (e.g. "Picking up on what others said…", "Counterpoint to the top comment…", "I'd push back on the framing here…").
- Templates are interpolated with `${topicName}` so Cowboys posts get cowboys-flavored comments, Doctor posts get doctor-flavored ones, etc.
- Keeps the existing topic-specific template arrays (Parent, Waiter, Chicago, …) and expands them so each topic has at least 10 distinct templates for variety, then falls back to the generic pool.
- Spreads `created_at` across the past few weeks so the thread looks naturally aged and ordered.
- Picks a different author for each comment, never the post's own author.
- After inserting all comments for a topic batch, runs a single `UPDATE posts SET comment_count = (subquery)` so the rail/sidebar counts stay correct.

The function is already batched by `topicOffset` / `topicLimit`, so we'll call it repeatedly in `comments` mode across all 227 topics (5 topics per call ≈ 45 invocations) to stay under edge-function timeouts.

### 2. Wire `CommentsSection` to read from Supabase

Replace the `getCommentsByPost(postId)` import in `src/components/post/CommentsSection.tsx` with a real Supabase query (`useQuery` against the `comments` table joined to `profiles` for username/avatar), keyed by `postId`. While loading, show a small skeleton; on empty, keep the existing "No comments yet" message.

Also update the comment submit handler (currently a no-op) to actually `insert` into the `comments` table when an authenticated user posts, and invalidate the query so the new comment appears immediately. Anonymous users keep seeing the "Sign in to join the discussion" link.

### 3. Adapt `CommentItem` to the real schema

The DB `comments` table only has `id, post_id, author_id, content, created_at` — there's no `parent_comment_id` or agree/disagree counts. So:

- Render comments as a flat list (no nesting). The "reply" affordance and the agree/disagree buttons stay as **local-only UI state** (they already are, even today), but their counts start at 0 instead of from seed data.
- Username comes from a `profiles` join; the profile-link href stays `/profile/{username}`.

This matches what the UI is actually capable of persisting today and avoids a schema migration.

## Technical details

**Files changed**
- `supabase/functions/seed-posts/index.ts` — expand templates, bump per-post count to 5–10, add comment_count refresh.
- `src/components/post/CommentsSection.tsx` — switch from `getCommentsByPost` to a Supabase `useQuery`; wire submit to insert into the `comments` table.
- `src/components/CommentItem.tsx` — accept the new DB-shaped comment row (drop `agreeCount`/`disagreeCount`/`heartCount` reads from props, keep them as local state); remove nested-replies rendering.

**Files NOT touched**
- `src/data/seedData.ts` — leave the legacy `comments` array in place (other dev surfaces may still reference `Comment` type).
- DB schema — no migration needed; the existing `comments` table fields are sufficient.

**Execution order after approval**
1. Edit the edge function and redeploy.
2. Edit the React components.
3. Run `seed-posts` in `mode: "comments"` across all 227 topics in batches of 5 (≈45 invocations), then verify with a `SELECT count(*) FROM comments` (expect 5–10 × 22,700 ≈ 110,000–225,000 rows) and a spot-check on a Cowboys / Florida post.

## What the user will see

Open any subtopic page → scroll to "Discussion" → there are 5 to 10 realistic comments from different users, with timestamps spread over the last few weeks, written in voices that respond to the post and to each other. Logged-in users can post a new comment and it appears immediately.
