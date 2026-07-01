## Fix two topic-list issues

### 1. "Working From Home" missing from priority order
The DB topic is named **"Working From Home"** but `PRIORITY_TOPICS` in `src/components/ColumnLayout.tsx` lists **"Work From Home"**, so it silently drops out of the curated order.

**Change:** rename the entry in `PRIORITY_TOPICS` from `"Work From Home"` → `"Working From Home"`. No other code touched; matching is already case-insensitive against the live DB.

### 2. "Related Topics" rail points to a non-existent "New York"
`src/components/TopicRecommendations.tsx` builds its list from the static `topics` array in `src/data/seedData.ts`, which still contains a stale `"New York"` state entry. The real DB topic is `"New York State"`, so clicking the suggestion lands on Topic Not Found. Several other seed entries (Working From Home, Homeowner, University of Wisconsin, etc.) have the same drift risk.

**Change:** refactor `TopicRecommendations.tsx` to source its list from live DB topics via `useTopics()`, the same pattern already used by `ColumnLayout`:
- Take `currentTopic` as-is.
- Get all topics from `useTopics()`.
- Split into `sameCategory` (same `categoryName`, excluding current) and `otherCategory`.
- Concatenate, slice to 12, render.
- Drop the `dbImageByName` merge step — images already come from the DB row.
- Keep the existing card markup, link target (`/topic/<name>`), and `TopicImage` fallback.

No changes to routing, `seedData.ts`, or the DB. No new topics created.

### Files touched
- `src/components/ColumnLayout.tsx` — one string change in `PRIORITY_TOPICS`.
- `src/components/TopicRecommendations.tsx` — swap data source to `useTopics()`.

### Verification
After build: reload `/`, confirm "Working From Home" appears in its slot (after "Man"). Open any topic page and confirm the Related Topics rail links to valid DB topics (no "New York" without "State").
