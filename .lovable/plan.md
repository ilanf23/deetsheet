# Add Mock Ratings to All Posts

## Goal
Seed every post (subtopic) with 5–10 random rating points so the UI shows realistic rank/score values across the platform.

## Approach
Run a one-time SQL data insert against the `ratings` table. The existing trigger `update_post_rating_stats` will automatically recompute `average_rating` and `rating_count` on each post — no extra work needed.

## Constraints discovered
- `ratings.user_id` has a foreign key to `auth.users`, so we cannot invent UUIDs. We must reuse real existing users (the 33 profiles in the database).
- `ratings` has a UNIQUE constraint on `(user_id, post_id)`, capping each post at 33 ratings max — 5–10 fits comfortably.
- 22,697 posts currently have zero ratings; 3 already have ratings (those will be left alone, or topped up to 5 minimum).

## Plan

1. For every post with `rating_count < 5`, insert random ratings from a random sample of existing profile user IDs.
2. Each post gets a random target between 5 and 10 ratings.
3. Each rating value is a random integer 1–10, weighted slightly toward 6–9 so averages look realistic (not flat 5.5).
4. Use `ON CONFLICT (user_id, post_id) DO NOTHING` to safely skip duplicates.
5. Trigger automatically updates `posts.average_rating` and `posts.rating_count`.

## Technical detail

Single SQL statement run via the database insert tool:

```sql
WITH users AS (SELECT id FROM profiles),
post_targets AS (
  SELECT id AS post_id, 5 + floor(random() * 6)::int AS target
  FROM posts WHERE rating_count < 5
),
expanded AS (
  SELECT pt.post_id, u.id AS user_id,
         -- weighted random 1–10 (skewed 6–9)
         GREATEST(1, LEAST(10, round(6 + (random() - 0.5) * 6)::int)) AS value,
         row_number() OVER (PARTITION BY pt.post_id ORDER BY random()) AS rn,
         pt.target
  FROM post_targets pt CROSS JOIN users u
)
INSERT INTO ratings (post_id, user_id, value)
SELECT post_id, user_id, value FROM expanded WHERE rn <= target
ON CONFLICT (user_id, post_id) DO NOTHING;
```

## Verification
After running, query a sample of posts to confirm `rating_count` is between 5–10 and `average_rating` is populated with varied values.

## Notes
- This is mock data for visual QA. If you later want to wipe it, we can delete ratings created in this batch by timestamp.
- Since the same 33 users get spread across 22k posts, each user will appear as a rater on many posts — fine for visual feel, but not realistic per-user activity.
