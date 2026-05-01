## Problem

On the homepage's "Recent Posts" sidebar, every post card shows what looks like the same image. The code in `buildPostImageUrl` already derives a per-post seed, but it only varies the `lock` query parameter while keeping the image tags identical (`topic,modifier`) across posts in the same topic. Loremflickr frequently returns the same "hero" photo for identical tag sets regardless of `lock`, so posts in the same topic collapse to one image.

## Fix

Update `buildPostImageUrl` in `src/lib/topicImageQueries.ts` so each post produces a meaningfully different URL:

1. Pick **two** modifiers per post (a primary + a secondary), chosen via two independent hashes of the `postId`. This changes the actual tag set per post, not just a numeric seed.
2. Use a much larger `lock` range (e.g. `% 1_000_000`) and incorporate `postId` directly into the hash so collisions are rare.
3. Add a tiny dimension jitter (e.g. width 600 vs 601 vs 602) derived from the seed, which forces Loremflickr to treat the request as a distinct image fetch.
4. Keep the function signature unchanged so `mapPost` in `src/hooks/useSupabaseTopics.ts` and the Recent Posts / Recently Added / PostCard / SubtopicPage call sites need no edits.

## Verification

- Reload `/` and confirm the 8 cards in "Recent Posts" each show a visibly different image.
- Confirm posts in the same topic still look on-theme but differ from one another.
- Confirm topic pages' "Recently Added" sidebar and individual post detail pages also pick up the new variety automatically (same helper).

## Files

- `src/lib/topicImageQueries.ts` — update `buildPostImageUrl` only.

No DB migration, no schema changes, no other call sites need edits.
