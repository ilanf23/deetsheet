# Independent Column Scrolling on Homepage

## Overview

Make the three columns of the homepage (Recently Added, Most Popular, Subjects) each scroll vertically and independently, while the header and hero banner remain fixed at the top of the viewport.

## Context

- Files involved: `src/pages/Index.tsx`, `src/components/ColumnLayout.tsx`
- Related patterns: Tailwind utility classes for layout (flex, overflow, h-screen)
- Dependencies: None

## Development Approach

- **Testing approach**: Regular (code first, then tests)
- Complete each task fully before moving to the next
- **CRITICAL: every task MUST include new/updated tests**
- **CRITICAL: all tests must pass before starting next task**

## Implementation Steps

### Task 1: Convert Index page to fixed viewport layout

**Files:**
- Modify: `src/pages/Index.tsx`

- [ ] Change the outer `div` to use `h-screen` and `overflow-hidden` so the page fills exactly the viewport height with no page-level scrollbar
- [ ] Make the `<main>` element use `flex-1 min-h-0 flex flex-col` so it takes remaining space after header
- [ ] Wrap HeroBanner in a `shrink-0` container so it keeps its natural height
- [ ] Make ColumnLayout's wrapper use `flex-1 min-h-0` so the column area fills remaining vertical space
- [ ] Remove `DeetFooter` from the fixed layout (it would be hidden since columns fill remaining space) or move it inside the scrollable middle column if desired
- [ ] Write tests verifying the Index page renders all three sections

### Task 2: Make each column independently scrollable

**Files:**
- Modify: `src/components/ColumnLayout.tsx`
- Modify: `src/components/RecentlyAddedSidebar.tsx`
- Modify: `src/components/SubjectsSidebar.tsx`

- [ ] Change the grid container in ColumnLayout to use `h-full` so it fills the available vertical space from the parent
- [ ] Add `overflow-y-auto` and `min-h-0` to each of the three column containers so they scroll independently
- [ ] In RecentlyAddedSidebar, ensure the outer container allows scrolling (remove any fixed height constraints if present, or adjust to use `h-full overflow-y-auto`)
- [ ] In SubjectsSidebar's wrapper div (in ColumnLayout), ensure the nav scrolls independently with `overflow-y-auto`
- [ ] Style scrollbars with Tailwind's `scrollbar-thin` or use custom CSS to make them subtle (thin, only visible on hover)
- [ ] Write tests verifying ColumnLayout renders all three columns

### Task 3: Verify acceptance criteria

- [ ] Run full test suite (`npm test`)
- [ ] Run linter (`npm run lint`)
- [ ] Visually verify each column scrolls independently in the browser
- [ ] Verify header and hero banner remain fixed and visible
- [ ] Verify the layout works on different viewport sizes

### Task 4: Update documentation

- [ ] Update CLAUDE.md if internal patterns changed
- [ ] Move this plan to `docs/plans/completed/`
