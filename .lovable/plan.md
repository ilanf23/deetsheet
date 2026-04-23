

# Profile-driven "For You" feed

## Problem

Right now the "For You" column only knows the user's city/state and falls back to "Trending nationally" — which surfaces NYC and LA topics for Elon Friedman in Jacksonville, FL. We need the feed to reflect **who the user is**, not just where they live.

## What changes

The "For You" column will be rebuilt around the signed-in user's profile. Instead of one location waterfall, we'll build **personalized topic groups** by matching profile fields directly to topics in the catalog.

### Signal mapping (profile field → topic match)

| Profile field | Matches topic in category | Example for Elon (Jacksonville, FL) |
|---|---|---|
| `state` | `States` | "Florida" |
| `city` | `Cities` (exact match only) | none → skip |
| `college` | `Colleges` | "Harvard", "UCLA"… |
| `major` | `Majors` | "Computer Science"… |
| `job` | `Jobs` (fuzzy: contains) | "Engineer" → matches if topic exists |
| `entity_type` / hobbies hints | `Hobbies`, `Pets`, `Clubs` | "Reading", "Photography"… |
| Age (from `birth_year`) | `Ages` (20s/30s/…) | "30s" |
| `country` | `Countries` | "United States" → skip (not in catalog) |

Each match becomes a section with a clear label, e.g.:
- **"Because you're in Florida"** → top posts from Florida topic
- **"For your major: Computer Science"**
- **"From your alma mater: UCLA"**
- **"In your 30s"**
- **"Your hobbies"**

### Rendering

Each section uses the existing `FeedTopicCard` (image + numbered list of 5 posts + Rating | You). No new visual patterns.

### Cascade & fallbacks

1. **Signed in with profile signal** → show personalized sections (above), capped at 8 topic cards total. Order: state → college → major → job → age → hobbies. Skip any signal that has no matching topic.
2. **Signed in but profile is sparse** (no matches found) → fall back to current city/state/national cascade.
3. **Signed out** → keep current behavior (city → state → national, driven by localStorage location).
4. **Always include a final "Trending nationally" section** when fewer than 4 personalized cards were filled, so the column never looks thin.

### "Show all locations" toggle

Repurpose the existing toggle at the top of "For You" to **"Show trending instead"** — when on, hides personalization and shows the national trending feed. Keeps the escape hatch the SOW required.

## Files touched

**`src/hooks/useHomeFeed.ts`** (rewrite core logic)
- Add a new `useProfileSignals()` helper that reads `profiles` (city, state, college, major, job, birth_year, entity_type) for the signed-in user.
- Build a list of `{ category, value, label }` signals from the profile.
- For each signal, look up the matching topic by `(category_name, name)` (case-insensitive `ilike` for fuzzy fields like `job`).
- Fetch top 5 posts per matched topic via the existing `fetchPostsForTopics()`.
- Section shape extended: `key: "profile" | "city" | "state" | "national"`, with a free-form `label` per section so each card group can say "Because you're in Florida", etc.
- If no profile matches, fall through to today's city → state → national logic unchanged.

**`src/components/HomeFeed.tsx`** (small)
- Update the `FeedSection` key type and toggle copy ("Show trending instead").
- No layout changes — still renders one card per topic via `FeedTopicCard`.

**`src/contexts/AuthContext.tsx`** (no change) — already exposes `user`.

## Technical notes

- All matching is done client-side after a single `profiles` read + a single `topics` read (both small). Topics are already cached by the existing `useSupabaseTopics` query — we'll reuse that cache via a shared queryKey to avoid a duplicate fetch.
- Age bucket derivation: `Math.floor((currentYear - birthYear) / 10) * 10` → `"20s"`, `"30s"`, etc.
- Job fuzzy match: `topics.name ilike %job%` limited to the `Jobs` category, take first hit.
- `expertiseTopics` is component-only state today (not in DB), so it won't be used in v1. Persisting it is a future enhancement.
- Query key becomes `["home-feed", userId, city, state]` so it invalidates correctly when the user edits their profile.
- No schema changes required.

## Acceptance

- Elon (Jacksonville, FL, with college/major/job set) sees sections like "Because you're in Florida", "For your major: …", "From your alma mater: …" — not LA/NYC.
- A brand-new signed-in user with no profile fields filled still sees the city/state/national cascade.
- Signed-out visitors see exactly today's behavior.
- "Show trending instead" toggle reveals only the national fallback.

