## Goal
Make the "Rating / You" column header on the Topic page match the font used on the Home page (Inter, 11px, muted gray).

## Current state
- **Home page** (`src/components/PopularTopicSection.tsx`): header uses `text-[11px] text-muted-foreground` (Inter body font).
- **Topic page** (`src/pages/TopicPage.tsx` line 199): this was already updated last turn from `text-sm md:text-base font-heading` to `text-[11px] text-muted-foreground` so it now matches the Home page.

## Plan
1. Visually verify on `/topic/:topicName` that the Rating/You header now renders in the same Inter 11px muted style as the Home page cards.
2. If anything still looks off (size, weight, or color), tighten the classes to exactly mirror the Home page header (`text-[11px] text-muted-foreground`, no `font-heading`).
3. No other pages currently render a "Rating / You" header that needs changing (the Topics directory page does not have one).

No new files, no schema changes — purely a Tailwind class tweak if a follow-up is needed.