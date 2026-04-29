## Goal

Replace the existing mock comments site-wide with a more realistic mix of comment lengths and phrasings. Right now all 143,975 comments are 485–867 characters long and clearly recycled from a few templates, which makes every discussion look identical and unnaturally verbose.

## Current state

- `comments` table: 143,975 rows, all between ~485 and ~867 chars (avg 602).
- Content is drawn from a small set of long-form templates with the topic name swapped in.
- No realistic short reactions ("Agreed.", "This.", "lol same"), no medium replies, no varied tone.

## Approach

One-shot SQL data update against the `comments` table. No schema changes, no app code changes. The existing trigger on `comments` already keeps `posts.comment_count` in sync, and we are not changing row counts, so post counts stay correct.

We will rewrite every comment's `content` using a weighted random pick from a length-tiered pool of templates. Each row gets one of:

- ~35% **micro** (1 short sentence, 10–60 chars) — "Agreed.", "This is gold.", "Hard disagree.", "Saving this one.", "Underrated take."
- ~30% **short** (1–2 sentences, 60–180 chars) — quick reactions, light pushback, a question.
- ~20% **medium** (2–4 sentences, 180–400 chars) — a real reply with a small example.
- ~12% **long** (1 paragraph, 400–700 chars) — a fuller take.
- ~3% **very long** (2 paragraphs, 700–1200 chars) — the occasional essay reply.

Each pool contains many template variants. Templates that reference the topic will pull the topic name via a join on `posts -> topics.name` so the comment still feels on-topic. Variant pick + length-tier pick are both randomized per row using `random()` so distribution is natural, not blocky.

Top-level comments and nested replies use slightly different pools (replies skew shorter and more conversational, top-level skews a bit longer) by checking `parent_comment_id IS NULL`.

We will not touch: `id`, `post_id`, `author_id`, `parent_comment_id`, `created_at`. Only `content` is rewritten.

## Technical detail

Single `UPDATE` executed via the database insert tool, structured roughly like:

```sql
WITH topic_for_comment AS (
  SELECT c.id AS comment_id,
         t.name AS topic_name,
         (c.parent_comment_id IS NULL) AS is_top_level,
         random() AS r_tier,
         random() AS r_variant
  FROM comments c
  JOIN posts  p ON p.id = c.post_id
  JOIN topics t ON t.id = p.topic_id
),
chosen AS (
  SELECT comment_id, topic_name, is_top_level, r_variant,
         CASE
           WHEN is_top_level THEN
             CASE
               WHEN r_tier < 0.25 THEN 'micro'
               WHEN r_tier < 0.55 THEN 'short'
               WHEN r_tier < 0.80 THEN 'medium'
               WHEN r_tier < 0.95 THEN 'long'
               ELSE 'xlong'
             END
           ELSE
             CASE
               WHEN r_tier < 0.45 THEN 'micro'
               WHEN r_tier < 0.78 THEN 'short'
               WHEN r_tier < 0.93 THEN 'medium'
               WHEN r_tier < 0.99 THEN 'long'
               ELSE 'xlong'
             END
         END AS tier
  FROM topic_for_comment
)
UPDATE comments c
SET content = pick_template(ch.tier, ch.topic_name, ch.r_variant)
FROM chosen ch
WHERE ch.comment_id = c.id;
```

`pick_template(tier, topic_name, r_variant)` will be inlined as a big `CASE` over a hand-written library of ~10–15 variants per tier (so ~50–70 templates total). Each variant is a plain string; `{topic}` is replaced with `topic_name` where used.

### Batching

143k rows with a heavy `UPDATE` plus the existing trigger on `comments` (`update_post_comment_count`) is fine because we are not changing `post_id`, but to stay under statement timeout we will run the update in batches of ~5,000 rows ordered by `id`, looping until done. Each batch is its own statement.

### Sample template flavor (not exhaustive)

- micro: "Agreed.", "This.", "Saving this.", "lol same.", "Hard agree.", "Nope.", "Cosign.", "Underrated."
- short: "Came here to say this. The {topic} crowd needed to hear it.", "Honestly? Not sure I buy this for {topic}, but I see the point."
- medium: 2–3 sentences with a small personal anchor, sometimes a question back to the thread.
- long / xlong: keep some of the existing flavor for variety, but only on a small percentage of rows.

## Verification

After running, re-check distribution:

```sql
SELECT
  CASE
    WHEN length(content) < 60 THEN '1_micro'
    WHEN length(content) < 180 THEN '2_short'
    WHEN length(content) < 400 THEN '3_medium'
    WHEN length(content) < 700 THEN '4_long'
    ELSE '5_xlong'
  END AS bucket,
  COUNT(*)
FROM comments
GROUP BY 1 ORDER BY 1;
```

Target: roughly the percentages listed above, with no single template dominating.

## Out of scope

- No changes to posts, ratings, profiles, or any UI code.
- No edits to the seed scripts (`supabase/functions/seed-posts`, `src/data/seedData.ts`); future seeded comments will still use the old generator. If you want the seed script updated to match this new variety, say so and I'll do it as a follow-up.
