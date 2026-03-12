

# Plan: Right Panel Clips to Left Column Height

## Problem
The right panel (`overflow-hidden`) extends beyond the left column's content because CSS Grid rows stretch to the tallest column by default. Since the recommendations panel has more content, the grid row grows to fit it — `overflow-hidden` alone doesn't help because the grid cell itself is tall.

## Solution
Use `align-start` on the grid so columns don't stretch to match each other's height. Then wrap the right panel in a container that uses `max-h` tied to the left column's actual height via a ref and state, OR more simply: use CSS `align-items: start` on the grid so each column only takes its natural height, combined with `overflow-hidden` on the right panel which will then clip at the grid row height determined by the left column.

Actually the simplest approach: set `align-items: start` on the grid (so columns don't stretch), but that would make the right column its own natural height. Instead, keep the default stretch behavior and just use `overflow-hidden` — which should already work. The issue is likely that `overflow-hidden` IS working but the grid row height is determined by the taller column.

The correct fix: Make the grid row height determined by the left column only. This can be done by setting `grid-template-rows: 1fr` and making the right column `max-h-full overflow-hidden`, or by absolutely positioning the right column within a relative container.

**Approach**: Use relative/absolute positioning for the right panel so it doesn't influence the grid row height.

### `src/pages/TopicPage.tsx`
- Change the right column wrapper to `relative` with `hidden lg:block`
- Inside, use an absolutely positioned inner div that fills the parent height with `overflow-hidden`
- This way the left column determines the grid row height, and the right column clips to match

