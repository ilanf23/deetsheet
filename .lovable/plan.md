## Goal

Make the "Rank Images" popup work for **every topic** with **topic-relevant** images (not random Picsum photos), backed by real data and ratings that auto-promote the winner to the topic's main image.

## Current state

- `RankImagesDialog` opens from `TopicPage` for any topic that has an `image_url`, but uses random Picsum seeds → images are unrelated to the topic.
- Ratings are mock numbers (`rank: 9.3`, `you: 9`); nothing persists.
- `SubtopicPage` does not yet trigger the dialog.
- No `topic_images` table exists.

## Plan

### 1. Make it work for ALL topics (not just ones with `image_url`)

- In `TopicPage.tsx`, render a clickable image slot **even when `topic.imageUrl` is null** — show a placeholder ("Add an image") that still opens the dialog.
- Wire the same dialog into `SubtopicPage.tsx` so subtopic headers behave identically.

### 2. Source topic-relevant images

Use **Unsplash Source** (no API key, deterministic by query) keyed on the topic name + category, so a "Waiter" topic returns waiter photos and "Paris" returns Paris photos.

```
https://source.unsplash.com/featured/600x600/?{encodeURIComponent(topic.name)},{category}
```

We'll generate ~12 candidates by appending varied modifier keywords per slot (e.g. `waiter,restaurant`, `waiter,server`, `waiter,uniform`, …). Modifiers come from a small per-category map in a new `src/lib/topicImageQueries.ts` so Cities/Jobs/Health each get sensible variants.

Fallback: if Unsplash returns nothing for a slot (rare), swap to `https://loremflickr.com/600/600/{keywords}` as a secondary CDN. Both are keyless.

### 3. Persist ratings + auto-promote winner

New table `topic_images`:

| column | type | notes |
|---|---|---|
| id | uuid pk | |
| topic_id | uuid | references topics(id) |
| url | text | candidate image URL |
| average_rating | numeric | default 0 |
| rating_count | int | default 0 |
| created_at | timestamptz | |

New table `topic_image_ratings`:

| column | type | notes |
|---|---|---|
| id | uuid pk | |
| topic_image_id | uuid | references topic_images(id) |
| user_id | uuid | auth.uid() |
| value | int (1–10) | |
| unique(topic_image_id, user_id) | | one rating per user per image |

- RLS: `topic_images` readable by everyone; insert restricted to authenticated users (so the dialog can lazy-seed candidates the first time a topic is opened). `topic_image_ratings` — users can CRUD their own rows; everyone can read.
- Trigger `update_topic_image_rating_stats` (mirrors existing `update_post_rating_stats`) keeps `average_rating` / `rating_count` fresh.
- Trigger `auto_promote_topic_image` on `topic_images` AFTER UPDATE: when a row's `average_rating` becomes the highest for its `topic_id` (and `rating_count >= 3` to avoid noise from a single voter), update `topics.image_url` to that row's `url`.

### 4. Wire dialog to real data

- New hook `useTopicImages(topicId)` — fetches `topic_images` for the topic + the current user's ratings; on first load with zero rows, seeds ~12 rows using the query generator from step 2.
- New hook `useRateTopicImage()` — upsert into `topic_image_ratings`, optimistic update, invalidates `topic-images` and `topic` queries (so the header image refreshes when promotion fires).
- `RankImagesDialog` becomes data-driven: replaces `buildMockImages` with hook data, makes the rating chip's "You" number a 1–10 slider/picker that calls the mutation. Unauthenticated clicks redirect to `/login` (consistent with existing rating UX per memory).

### Technical details

Files to add:
- `supabase/migrations/<ts>_topic_images.sql` — tables, RLS, triggers
- `src/lib/topicImageQueries.ts` — per-category keyword variants
- `src/hooks/useTopicImages.ts` — fetch + seed + rate

Files to edit:
- `src/components/topic/RankImagesDialog.tsx` — real data, real ratings, 1–10 picker
- `src/pages/TopicPage.tsx` — always render image slot (placeholder when null)
- `src/pages/SubtopicPage.tsx` — wire up the same dialog

### Out of scope (will mention after)

- Admin UI to curate / remove candidate images
- Uploading custom candidates from users
