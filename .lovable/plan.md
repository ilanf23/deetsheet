# Fix: Priority topic order breaks after "Married"

## Root cause

The homepage Most Popular column iterates `PRIORITY_TOPICS` against the **local `seedData.topics` list**. Many of your priority names don't exist in seed data — so they get silently dropped and replaced by popular tail topics, breaking the order you specified.

Missing from seedData (and therefore skipped today):
- Wisconsin, Pet Peeves, Work From Home, Teacher, Old, University of Wisconsin, Gentleman, Nurse, Homeowner, Baby, Real Estate Agent

That's why everything after "Married" looks out of order — the gaps collapse and the auto-sorted tail starts earlier than intended.

## Fix

Switch `ColumnLayout.tsx` to drive the Most Popular column from the **live database** (`useTopics()`) instead of the static seed file:

1. Call `useTopics()` to get every real topic with its live `postCount`.
2. Build `priority` by matching `PRIORITY_TOPICS` (case-insensitive) against the DB list — any priority name that does exist in the DB renders in the exact order you gave.
3. Build `rest` from the remaining DB topics, sorted by `postCount` descending.
4. Concatenate and feed into the existing infinite-scroll list. `PopularTopicSection` already accepts a `Topic`-shaped object, so we pass through `{ id, name, categoryName, imageUrl, postCount, topPosts: [] }` from the DB row.
5. Any priority topic still missing from the DB (e.g. if "Pet Peeves" was never created) gets logged once to the console as a one-time admin signal, then skipped — instead of silently collapsing the order.

## Out of scope

- Not changing the priority list itself.
- Not touching `RecentlyAddedSidebar` or `SubjectsSidebar`.
- Not creating new DB topics — if a name is missing, that's an admin action in `/admin/topics`. I'll list which ones are missing after the swap so you can decide whether to add them.

## Verification

After implementing, I'll open `/` and confirm the middle column renders in your exact order through "Real Estate Agent" (for the topics that exist in the DB), and report any priority names that aren't present so you can create them.
