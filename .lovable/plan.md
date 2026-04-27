## Goal

Strip em dashes (—) from all user-visible content: posts, topics, comments, and the seed/template strings that future seeded content comes from. Also fix a lingering TypeScript build error in `SubtopicPage.tsx`.

## Scope (current data)

A scan of the database shows:
- **22,700 posts** contain em dashes (in `title` and/or `content`)
- **96,684 comments** contain em dashes
- **0 topics** contain em dashes (nothing to do there)
- 0 en dashes (–) anywhere — only em dashes need replacing

## Replacement rule

Replace every em dash (`—`, U+2014) with a comma + space (`, `), then collapse any accidental `, ,` / leading/trailing whitespace artifacts. This reads more naturally than a plain space and matches how the seeded sentences were written (e.g. `"...not the ones who never struggled — they're the ones..."` → `"...not the ones who never struggled, they're the ones..."`).

If a line has the em dash surrounded by spaces (` — `), it becomes `, `. If it's adjacent to a word with no spaces (rare), it becomes `, ` as well.

## Plan

### 1. One-shot DB cleanup (data update via migration)

Run a migration that updates existing rows in place:

```sql
UPDATE public.posts
SET
  title   = regexp_replace(replace(title,   '—', ', '), '\s*,\s*,\s*', ', ', 'g'),
  content = regexp_replace(replace(content, '—', ', '), '\s*,\s*,\s*', ', ', 'g')
WHERE title LIKE '%—%' OR content LIKE '%—%';

UPDATE public.comments
SET content = regexp_replace(replace(content, '—', ', '), '\s*,\s*,\s*', ', ', 'g')
WHERE content LIKE '%—%';

UPDATE public.topics
SET
  name        = replace(name, '—', ', '),
  description = replace(description, '—', ', ')
WHERE name LIKE '%—%' OR description LIKE '%—%';
```

This handles all ~119k rows server-side in one pass.

### 2. Strip em dashes from seed templates so newly seeded content stays clean

- `supabase/functions/seed-posts/index.ts` — the post-body and comment-body templates currently include em dashes. Replace each `—` in string literals with `,` (or remove where it reads better as a sentence break).
- `src/data/seedData.ts` — same treatment for any remaining seed strings used as fallbacks.

### 3. Strip em dashes from static UI copy

Sweep these files and rewrite the em dashes that appear inside JSX text or string constants (UI copy only, not code comments):
- `src/pages/SignUp.tsx`, `src/pages/Privacy.tsx`, `src/pages/Profile.tsx`, `src/pages/ProfileView.tsx`, `src/pages/TopicPage.tsx`, `src/pages/SubtopicPage.tsx`
- `src/pages/admin/AdminUsers.tsx`, `AdminPosts.tsx`, `AdminTopics.tsx`, `AdminComments.tsx`
- `src/components/HeroBanner.tsx`, `CreatePostDialog.tsx`, `PostActionMenu.tsx`, `ColumnLayout.tsx`, `UserRatingIndicator.tsx`
- `src/components/post/PostMetaBar.tsx`, `PostRatingBox.tsx`

Em dashes inside code comments / file headers (e.g. `useSupabaseTopics.ts`, migration files) are left alone — they're not user-facing.

### 4. Fix the existing TS build error

`src/pages/SubtopicPage.tsx:159` references `post.authorId`, but the legacy `Post` type from `seedData.ts` doesn't declare it. The runtime row from `usePostsByTopic` does have `authorId` (see `useSupabaseTopics.ts` mapper). Fix by switching the local `Post` type to the `PostRow` shape returned by the hook (drop the `as Post` cast):

```ts
import type { PostRow } from "@/hooks/useSupabaseTopics";
// ...
const posts = postsData ?? [];
```

This removes the bad cast and lets TypeScript see `authorId`, `commentCount`, etc. correctly.

## Out of scope

- Em dashes inside developer-only files (migrations already applied, JSDoc, code comments) — not visible to end users.
- En dashes (–), hyphens (-), and minus signs — none requested, none present in content.
- Changing the *style* of dashes globally (e.g. forcing two hyphens). The user asked to remove em dashes; a comma keeps the prose readable.

## Verification

After the migration runs, re-query:

```sql
SELECT
  (SELECT COUNT(*) FROM posts    WHERE title LIKE '%—%' OR content LIKE '%—%') AS posts_left,
  (SELECT COUNT(*) FROM comments WHERE content LIKE '%—%')                      AS comments_left,
  (SELECT COUNT(*) FROM topics   WHERE name  LIKE '%—%' OR COALESCE(description,'') LIKE '%—%') AS topics_left;
```

Expected: all zero. Then `npm run build` to confirm no TS errors remain.
