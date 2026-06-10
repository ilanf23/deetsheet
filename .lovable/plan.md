# Plan: Delete fredbrewer's AI-seeded posts (with safeguards)

## Goal
Remove the ~509 AI/seed posts attributed to **fredbrewer** (`6d711ce0-f0fd-4a42-b052-a2b72f43aea1`) without touching any other user's data, and without losing the ability to recover if the analysis is wrong.

## Scope guardrails (hard rules the migration will enforce)
- Every delete is filtered by **`author_id = '6d711ce0-f0fd-4a42-b052-a2b72f43aea1'`** — no other user's row can ever be touched.
- Every delete is also filtered by **the seed criteria** (see step 2) — fredbrewer's organic posts on other days are not touched.
- Cascading deletes (ratings, comments, favorites, reports on the deleted posts) are **scoped by `post_id IN (...the archived set...)`** — only data attached to the archived posts is removed.
- No changes to `auth.users`, `profiles`, `user_roles`, `topics`, or any other user's posts/comments.

## Step 1 — Verify the seed batch (read-only)
Before anything destructive, confirm the AI-vs-real split with these checks:

1. Cluster check: do the 509 posts on `2026-04-24` have `created_at` timestamps within a few seconds/minutes of each other?
2. Engagement check: do they have ~0 ratings/comments from real users?
3. Topic spread: are they sprayed across many topics evenly (seed pattern) vs. concentrated on a few (human pattern)?
4. Content fingerprint: do they share a uniform structure/length?

If anything looks off (e.g., the 2026-04-24 set contains posts that look human-written or have real engagement), I stop and report back before continuing.

## Step 2 — Lock in the exact "fake" set
Define the seed set as a single, repeatable SQL filter:

```text
author_id = '6d711ce0-f0fd-4a42-b052-a2b72f43aea1'
AND created_at::date = '2026-04-24'
```

Every later step uses this exact filter. Print the row count and re-confirm = 509 before proceeding.

## Step 3 — CSV export (belt #1)
Export the full rows (all columns) of the seed set to `/mnt/documents/fredbrewer-seed-posts-backup.csv`, plus a second CSV of all ratings/comments attached to those posts. These files live outside the database and are downloadable.

## Step 4 — Create archive tables (belt #2)
In a single migration, create archive tables that mirror the live tables:

- `posts_archive_fredbrewer_20260610`
- `comments_archive_fredbrewer_20260610`
- `ratings_archive_fredbrewer_20260610`
- `favorites_archive_fredbrewer_20260610`
- `reports_archive_fredbrewer_20260610`

Each archive table is admin-only (no anon/authenticated grants) and copies the full row including original `id`, `author_id`, `created_at`, content, etc. — so any row can be re-inserted into the live table verbatim.

## Step 5 — Copy then delete (one transaction)
In the same migration, inside a single transaction:

1. `INSERT INTO posts_archive_...` SELECT … from the seed set.
2. `INSERT INTO comments_archive_...` SELECT … WHERE `post_id IN (seed set)`.
3. Same for ratings, favorites, reports.
4. Assert archived count = 509 (raise & rollback if not).
5. `DELETE FROM ratings/comments/favorites/reports WHERE post_id IN (seed set)`.
6. `DELETE FROM posts WHERE` (the exact filter from Step 2).
7. Assert remaining fredbrewer posts = 131 (raise & rollback if not).
8. Recompute `post_count` on affected topics and `comment_count` on any affected posts.

If any assertion fails the whole transaction rolls back and nothing changes.

## Step 6 — Verification (read-only, post-delete)
- fredbrewer total posts = 131
- All other users' post counts unchanged (snapshot before/after)
- Archive table row counts match what was deleted
- Site loads, topic pages render

## Recovery options (in order of ease)
1. **Restore one post**: `INSERT INTO posts SELECT * FROM posts_archive_... WHERE id = '<post-id>'` (plus its comments/ratings from the matching archive tables).
2. **Restore all 509**: same as above without the `WHERE id =` clause.
3. **Lovable Cloud point-in-time recovery**: full DB roll-back to before the migration (last resort — also reverts anything else that happened after).

The archive tables stay in place until you explicitly tell me to drop them.

## What I will NOT do
- Touch fredbrewer's 131 organic posts.
- Touch any other user's posts, comments, ratings, profile, or account.
- Delete fredbrewer's account or profile.
- Drop the archive tables without asking.

## Deliverables after you approve
- 1 migration: archive tables + transactional copy-then-delete with assertions.
- 2 CSV backups in `/mnt/documents/`.
- Before/after row-count report posted in chat.
