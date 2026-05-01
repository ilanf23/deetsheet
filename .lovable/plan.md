## Goal

Right now every post in "Recent Posts" / "Recently Added" shares the topic's hero image (we pass `topics.image_url` through to `PostCard`'s `imageUrl`). So all posts in the same topic look identical, and the post detail page has no image at all. We'll generate a **unique, on-theme image per post** and use it everywhere.

## Approach

Use the same Loremflickr keyword-seeded URL builder that powers the topic ranking dialog, but seed it with the **post id** so each post gets its own deterministic image that is still on-theme for its topic/category. No DB migration, no new table, no API key.

### 1. New helper `buildPostImageUrl(postId, topicName, categoryName)`

In `src/lib/topicImageQueries.ts` add a sibling to `buildTopicImageUrls`:

- Reuse `MODIFIERS_BY_CATEGORY` / `DEFAULT_MODIFIERS` and `hashString`.
- Pick one modifier deterministically: `modifiers[hashString(postId) % modifiers.length]`.
- Build URL: `https://loremflickr.com/600/600/{topicTag},{modifier}?lock={hashString(postId) % 100000}`.
- Returns a single URL — stable across reloads, unique per post, varied across posts in the same topic.

### 2. Per-post image in the recent-posts hooks

In `src/hooks/useSupabaseTopics.ts` update `mapPost` so `imageUrl` is generated per post instead of falling back to the topic's hero:

```ts
imageUrl: buildPostImageUrl(row.id, row.topics?.name ?? "", row.topics?.category_name ?? "Life"),
```

This automatically affects every consumer:
- Homepage left column — `RecentlyAddedSidebar` → `PostCard`
- Topic page right rail — `TopicRecentlyAdded` → `PostCard`
- Subtopic/post page left rail — same `TopicRecentlyAdded`

`PostCard` already renders the thumbnail when `imageUrl` is present, so no changes there.

### 3. Add an image to the post detail page

In `src/pages/SubtopicPage.tsx`, between `PostHeader`/`AuthorByline` and `PostBody`, render the post's image when available:

```tsx
{post && (
  <img
    src={buildPostImageUrl(post.id, topic.name, topic.categoryName)}
    alt={post.title || topic.name}
    className="w-full max-w-[var(--reading-max-width)] rounded-lg border border-border object-cover aspect-[16/9]"
    loading="lazy"
  />
)}
```

Place it just above `<PostBody />` so the read flows: title → byline → meta → reactions → **image** → body → comments. Add an `onError` handler to hide the element if the image fails to load (same pattern as `RankImagesDialog`).

## Files to change

- `src/lib/topicImageQueries.ts` — export new `buildPostImageUrl`.
- `src/hooks/useSupabaseTopics.ts` — generate per-post `imageUrl` in `mapPost`.
- `src/pages/SubtopicPage.tsx` — render the post image above `PostBody`.

## Notes

- No DB writes — image URLs are derived at render time, so backfill isn't needed and topics with zero `topic_images` rows still get post thumbnails.
- The topic hero (`topics.image_url`, used on `TopicPage` header and topic cards) is unchanged.
- If you'd rather persist a `posts.image_url` column later for editorial control, we can layer that on top — the helper would just become the fallback.
