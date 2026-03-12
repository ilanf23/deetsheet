

# Plan: Fix Laggy Scrolling

## Problem
The page has three independent scrollable containers (Recently Added, Most Popular, Subjects sidebar), each with `max-h-[calc(100vh-100px)] overflow-y-auto`. These nested scroll regions compete with the main page scroll, causing jank and lag — the browser can't determine which container should scroll until it processes the event.

## Solution
Remove the independent scroll containers and let the entire page scroll naturally as one document. The columns will simply stack their content and the browser's native page scroll handles everything smoothly.

## Changes

### `src/components/ColumnLayout.tsx`
- Remove `overflow-hidden` from the outer wrapper
- Remove `lg:max-h-[calc(100vh-100px)] lg:overflow-y-auto scrollbar-thin lg:pr-2` from the Most Popular and Subjects sidebar columns

### `src/components/RecentlyAddedSidebar.tsx`
- Remove `lg:max-h-[calc(100vh-100px)] lg:overflow-y-auto scrollbar-thin lg:pr-2` from the posts container

### `src/pages/Index.tsx`
- Remove `overflow-x-hidden` from the outer div (unnecessary with proper layout)

This is a CSS-only fix — no logic changes, no new dependencies.

