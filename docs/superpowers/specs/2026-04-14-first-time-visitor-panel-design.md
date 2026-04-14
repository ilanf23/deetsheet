# First-Time Visitor Panel — Design

**Date:** 2026-04-14
**Scope:** Homepage onboarding nudge for unauthenticated visitors

## Summary

Unauthenticated first-time visitors land on the homepage and see a hero-sized panel in place of the rotating `HeroBanner` carousel. The panel reads "New here? Tell us where you're looking and what matters to you" and presents two chip rows (Topic + Location). After the user picks one chip from each and confirms, the page re-renders: the hero slot reverts to the normal `HeroBanner` carousel, a slim strip above `ColumnLayout` shows their selections with a "Change" link, and `ColumnLayout` filters its data columns to match.

No overlay, no blocker. Returning visitors, skipped-panel visitors, and authenticated users always see the carousel.

## Visitor States

Driven by localStorage key `deetsheet:onboarding:v1` plus `useAuth()`. Authenticated users bypass all panel logic.

| State | localStorage | Hero slot | Strip | `ColumnLayout` |
|---|---|---|---|---|
| First-time | absent | `FirstTimePanel` | hidden | unfiltered |
| Personalized | `{ topicId, locationId }` | `HeroBanner` | visible | filtered |
| Skipped | `{ dismissed: true }` | `HeroBanner` | hidden | unfiltered |

**`isFirstTime`** = unauthenticated AND no `topicId`/`locationId` AND `dismissed !== true`.

## Components

### `src/lib/onboardingChips.ts` (new)

Curated constants, no dynamic data.

```ts
export type OnboardingChip = {
  id: string;
  label: string;
  matchKeywords: string[];
};

export const TOPIC_CHIPS: OnboardingChip[] = [
  { id: "city",          label: "City & Town",     matchKeywords: ["Chicago", "New York City", "City"] },
  { id: "food",          label: "Food & Drink",    matchKeywords: ["Waiter", "McDonald's", "Restaurant"] },
  { id: "relationships", label: "Love & Life",     matchKeywords: ["Love", "Married", "Parent"] },
  { id: "hobbies",       label: "Hobbies",         matchKeywords: ["iPhone", "1980s"] },
  { id: "school",        label: "School",          matchKeywords: ["College"] },
  { id: "health",        label: "Health",          matchKeywords: ["Cancer", "Doctor"] },
];

export const LOCATION_CHIPS: OnboardingChip[] = [
  { id: "nyc",      label: "New York",    matchKeywords: ["New York"] },
  { id: "chicago",  label: "Chicago",     matchKeywords: ["Chicago"] },
  { id: "la",       label: "Los Angeles", matchKeywords: ["Los Angeles", "LA"] },
  { id: "boston",   label: "Boston",      matchKeywords: ["Boston"] },
  { id: "sf",       label: "San Francisco", matchKeywords: ["San Francisco", "SF"] },
  { id: "austin",   label: "Austin",      matchKeywords: ["Austin"] },
  { id: "seattle",  label: "Seattle",     matchKeywords: ["Seattle"] },
  { id: "miami",    label: "Miami",       matchKeywords: ["Miami"] },
  { id: "portland", label: "Portland",    matchKeywords: ["Portland"] },
  { id: "denver",   label: "Denver",      matchKeywords: ["Denver"] },
  { id: "nashville", label: "Nashville",  matchKeywords: ["Nashville"] },
  { id: "other",    label: "Somewhere else", matchKeywords: [] },
];
```

Final lists may be tuned during implementation; the `matchKeywords` field is the authoritative hook for filtering `topics` seed data.

### `src/hooks/useOnboarding.ts` (new)

```ts
type OnboardingState = {
  dismissed?: boolean;
  topicId?: string;
  locationId?: string;
};
```

Returns `{ state, isFirstTime, select(topicId, locationId), skip(), reset() }`. Uses a lazy `useState` initializer to read `localStorage` on mount; each mutation writes back synchronously. `isFirstTime` also consults `useAuth()` — authenticated users are never first-time regardless of storage.

### `src/components/FirstTimePanel.tsx` (new)

Visual match for `HeroBanner`:

- `relative w-full h-[170px] md:h-[200px]` container.
- Background: `/hero-city.jpg` with `bg-black/40` overlay (existing asset, zero new imagery).
- Centered white headline: `font-extrabold text-xl sm:text-2xl md:text-3xl leading-tight`, copy: "New here? Tell us where you're looking and what matters to you."
- Two chip rows below the headline, each prefixed with a `text-xs uppercase tracking-wider text-white/70` label:
  - "I'm interested in" → topic chips
  - "I'm looking around" → location chips
- Chip style: `rounded-full px-3 py-1 text-xs border border-white/40 bg-white/10 text-white`. Selected: `bg-primary border-primary text-white`. Single-select per row.
- "See my view" CTA: green `bg-primary text-white rounded-full` pill, appears only once both a topic and a location are selected. Calls `select(topicId, locationId)`.
- "Skip for now" link: `text-xs text-white/80 underline` in the bottom-right corner. Calls `skip()`.

### `src/components/PersonalizedStrip.tsx` (new)

Full-width slim strip, self-hides when `state.topicId && state.locationId` is false.

- `border-b border-border py-2 px-6 lg:px-10 text-xs flex items-center justify-between`.
- Left: `"Showing:"` in `text-muted-foreground`, then the location label and topic label separated by `·`, both in `text-foreground` (static, non-interactive).
- Right: `"Change"` in `text-primary hover:underline` (interactive). Calls `reset()`, which clears the entire record and returns the user to the first-time state (panel reappears).

### `src/pages/Index.tsx` (modified)

```tsx
const { isFirstTime, state } = useOnboarding();

return (
  <div className="min-h-screen flex flex-col bg-white">
    <DeetHeader />
    <main className="flex-1">
      {isFirstTime ? <FirstTimePanel /> : <HeroBanner />}
      <PersonalizedStrip />
      <ColumnLayout topicId={state.topicId} locationId={state.locationId} />
    </main>
    <DeetFooter />
  </div>
);
```

### `src/components/ColumnLayout.tsx` (modified)

Accepts optional `topicId?: string` and `locationId?: string` props. When present:

- **Most Popular** — resolve `topicId` → `TOPIC_CHIPS` entry → filter `topics` by `matchKeywords` (case-insensitive match on `topic.name` or `topic.category`). If fewer than 4 match, pad with the current hardcoded shortlist so the column never looks broken.
- **Recently Added** — push `locationId` into `RecentlyAddedSidebar` via a new prop; filter its seed posts by location substring match. Same pad-to-minimum rule.
- **Subjects** — unchanged.

When both props are undefined, fall back to today's behavior exactly.

## Transitions

1. **Select** — user picks both chips + clicks "See my view" → `select()` writes `{ topicId, locationId }` → re-render → `isFirstTime` flips false → hero swaps to `HeroBanner`, strip appears, columns filter. No route change.
2. **Skip** — user clicks "Skip for now" → writes `{ dismissed: true }` → hero swaps to `HeroBanner`, strip hidden, columns unfiltered. Panel will not return.
3. **Change** — user clicks "Change" on the strip → `reset()` clears the record → `isFirstTime` flips true → panel returns. Per Q5B the selections are reversible; "Change" = re-pick.

## Color Contract Compliance

Per `CLAUDE.md`:

- **Chips on dark backdrop**: white text in unselected state is acceptable because the chip is a button (interactive → underline/hover indicated by border + background shift, not color — the hover affordance is the fill, not an underline). Selected chip uses `bg-primary`.
- **"Skip for now"** and **CTA button**: white/green pills, interactive.
- **Strip "Showing:" prefix**: `text-muted-foreground`, non-interactive.
- **Strip location/topic labels**: `text-foreground` (black), non-interactive — they are the user's confirmed selections, not links.
- **Strip "Change"**: `text-primary`, interactive with `hover:underline`.
- **Hero headline**: white, non-interactive.

## Non-Goals (YAGNI)

- No Supabase writes, no syncing selections to a profile. If the user signs up after selecting, selections remain only in localStorage and the panel simply stops gating UI. A future ticket can migrate localStorage → profile.
- No analytics events. Add instrumentation in a follow-up if needed.
- No animation on the panel → carousel swap; a normal React re-render is fine.
- No multi-select, no free-text input, no "Other" for topics (location has "Somewhere else" as an escape hatch because geography is long-tail; topic categories are intentionally finite).
- No Subjects sidebar personalization.

## Open Questions

None. All Q1–Q8 resolved. The only implementation detail left to tune is the exact chip labels/keywords, which is a copy decision made inside `onboardingChips.ts`.
