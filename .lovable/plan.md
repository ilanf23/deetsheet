## Goal

Allow users to reply to any comment, and to replies of replies, with no depth limit. The frontend UI for nested replies is already built, but it's failing with the error "Could not find the 'parent_comment_id' column of 'comments' in the schema cache" because the database column doesn't exist.

## Root Cause

The `public.comments` table currently has only: `id`, `post_id`, `author_id`, `content`, `created_at`. The reply UI (CommentItem, CommentsSection, InlineCommentComposer) already reads/writes `parent_comment_id`, but the column was never added to the database.

## Changes

### 1. Database migration (single migration)

Add the self-referencing column and an index to support fast tree fetches:

```sql
ALTER TABLE public.comments
  ADD COLUMN parent_comment_id uuid NULL
  REFERENCES public.comments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_comments_parent_comment_id
  ON public.comments(parent_comment_id);

CREATE INDEX IF NOT EXISTS idx_comments_post_id_created_at
  ON public.comments(post_id, created_at);
```

Notes:
- `NULL` = top-level comment (current behavior preserved for all existing rows).
- `ON DELETE CASCADE` so deleting a comment cleans up its replies.
- No RLS changes needed — existing policies on `comments` already cover insert/select/update/delete by post and author.

### 2. Frontend

The frontend is already wired correctly:
- `InlineCommentComposer` sends `parent_comment_id` on insert.
- `CommentsSection` fetches it, builds a tree, and recursively renders.
- `CommentItem` already supports unlimited logical depth (visual indent caps at 5 levels on mobile / 8 on desktop so deep threads stay readable, but reply nesting itself is unlimited).

No frontend code changes are required after the migration runs. The schema cache will refresh automatically and the "Reply" button will start working at every depth.

### 3. Verification

After the migration:
- Post a top-level comment, reply to it, then reply to that reply (and so on) to confirm infinite nesting works.
- Confirm existing comments still display unchanged (all have `parent_comment_id = NULL`).

## Out of scope

- No changes to seed data — existing seeded comments remain top-level.
- No change to the visual indent caps (purely presentational; logical nesting is already unlimited).
