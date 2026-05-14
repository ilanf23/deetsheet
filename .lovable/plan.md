## Goal
Make topic creation work end-to-end, give admins real moderation power, and close the trigger/column gaps that leave `post_count`, `comment_count`, `score`, and `like_count` permanently stale.

## Scope

### 1. Topics — unblock creation & admin management
- Add column `topics.created_by uuid` (nullable, references `auth.users(id)` on delete set null) so the existing `CreateTopicDialog` payload matches the schema and ProfileView can later show "topics I created."
- Add RLS policies on `public.topics`:
  - INSERT: any authenticated user (`auth.uid() is not null`), with `created_by = auth.uid()` enforced in WITH CHECK.
  - UPDATE: admins only (`has_role(auth.uid(), 'admin')`).
  - DELETE: admins only.
- Add trigger `update_topic_post_count` on `public.posts` (AFTER INSERT/DELETE) that recomputes `topics.post_count` for the affected `topic_id`. Mirrors the existing `update_post_comment_count` pattern.
- Backfill `topics.post_count` once from current `posts` rows.

### 2. Comments — make counters real
- Verify and (re)create the trigger that binds `update_post_comment_count` to `public.comments` AFTER INSERT/DELETE. The function exists; the trigger appears to be missing, so `posts.comment_count` doesn't update on new comments.
- Add column `comments.like_count integer not null default 0`.
- Add trigger function + trigger on `public.comment_likes` (AFTER INSERT/DELETE) that recomputes `comments.like_count` for the affected `comment_id`. Backfill once.
- Remove the defensive fallback in `src/components/post/CommentsSection.tsx` once the column is guaranteed present (keep the select clean).

### 3. Posts — make `score` real
- Add trigger function + trigger on `public.votes` (AFTER INSERT/UPDATE/DELETE) that recomputes `posts.score = SUM(value)` for the affected `post_id`. Backfill once.

### 4. Topic images — admin moderation
- Add RLS policies on `public.topic_images`:
  - UPDATE: admins only.
  - DELETE: admins only (also covers removing offensive uploads).

### 5. Auth security triggers (verification only — no code change unless missing)
- Confirm `handle_new_user`, `handle_new_user_security`, and `sync_email_verified` are actually attached as triggers on `auth.users`. If any are missing, attach them in this same migration.

## Out of scope (flag only, don't change now)
- Adding FK from `posts.author_id` / `comments.author_id` to `profiles` (would let us use Supabase nested selects). Larger refactor — call out in summary, ship separately if you want it.
- `post_follows` table existence check — verify in passing; only act if it's truly missing.

## Deliverables
1. **One Supabase migration** containing all schema changes, policies, trigger functions, triggers, and backfills above.
2. **One small client edit**: `src/components/post/CommentsSection.tsx` — drop the `like_count` fallback path now that the column is guaranteed.

## Validation after apply
- Create a topic from `/profile` → succeeds, appears in `/topics` with `post_count = 0`.
- Create a post in that topic → `topics.post_count` increments; `posts.comment_count` is 0.
- Add a comment → `posts.comment_count` increments.
- Like a comment → `comments.like_count` increments.
- Cast a vote → `posts.score` updates.
- Non-admin attempting `topics.update`/`delete` → blocked. Admin → succeeds.

## Technical notes
- All new policies use the existing `has_role(_user_id, _role)` security-definer function — no recursion risk.
- All new trigger functions follow the project pattern: `LANGUAGE plpgsql SECURITY DEFINER SET search_path = public`, handling `TG_OP = 'DELETE'` to read `OLD`.
- `created_by` is added as nullable so existing topic rows remain valid; new rows get it from `auth.uid()` via WITH CHECK.
