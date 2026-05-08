# Mobile Layout Changes

Documentation of mobile-responsive changes made to fit content on a single screen and provide column-based navigation on small viewports.

## Header (`src/components/DeetHeader.tsx`)

- Removed the hamburger menu (`Menu`/`X` buttons) and the mobile drawer to keep the nav on a single row.
- Added a profile icon to the right of the search bar in the mobile nav:
  - Signed out: `UserCircle2` icon (lucide-react, `strokeWidth={1.75}`).
  - Signed in: user avatar (`AvatarImage` + `AvatarFallback`).
- Shrunk the mobile logo from `h-[166px]` to `h-20 md:h-[166px]` with reduced top margin so everything fits in one screen.

## Homepage (`src/components/ColumnLayout.tsx`)

Added a mobile tab switcher above the grid that toggles which column is visible. Each tab maps directly to a column (left → middle → right):

1. **Recently Added** (default) — left column
2. **Most Popular** — middle column
3. **Subjects/Topics** — right column

On `lg+` all three columns render side-by-side as before.

## Topic Page (`src/pages/TopicPage.tsx`)

Added the same column-based mobile tab switcher:

1. **Recently Added** (default) — left rail
2. **Posts** — main posts list
3. **Recommended** — right rail (`TopicRecommendations`)

Other mobile tweaks on the topic page:

- Header restructured on mobile (`md:hidden`) so the topic image renders as a full-width banner under the title, with the follow button below it.
- `TopicHeaderImage` gained a `fullWidth` prop. When `true` it uses `h-40 w-full`; otherwise it uses the desktop `h-[7.7rem] w-[17.6rem]`.

## Post Page (`src/pages/SubtopicPage.tsx`)

Added the same column-based mobile tab switcher:

1. **Recently Added** (default) — left rail
2. **Post** — the article (header, body, judgements, comments)
3. **Recommended** — right rail (`TopicRecommendations`)

Removed the duplicate stacked rails that previously rendered below the article on mobile, since the tabs now expose them directly.

## Tab switcher styling (shared pattern)

```tsx
<div className="lg:hidden mb-4 flex gap-1 rounded-lg bg-muted p-1">
  {tabs.map((t) => (
    <button
      key={t.id}
      type="button"
      onClick={() => setMobileTab(t.id)}
      className={`flex-1 px-2 py-2 text-xs font-semibold rounded-md transition-colors ${
        mobileTab === t.id
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground"
      }`}
    >
      {t.label}
    </button>
  ))}
</div>
```

Each column then uses a conditional class:

```tsx
className={`${mobileTab === "recent" ? "block" : "hidden"} lg:block ...`}
```

This keeps desktop layouts untouched while giving mobile users a clear column-based switcher.
