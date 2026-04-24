## Bug

On every subtopic page (`/topic/:topic/post/:rank`), clicking the green **"Back to {Topic}"** link in the breadcrumb sends the user to the homepage (`/`) instead of the topic page.

I reproduced this in the live preview from `/topic/Florida/post/1` and `/topic/Florida/post/2` — both ended at `/`, even though the link is coded with `to="/topic/Florida"` and that URL works correctly when typed directly into the address bar.

## Root cause

The link in `src/pages/SubtopicPage.tsx` is rendered as a React Router `<Link>`:

```tsx
const backToTopicHref = `/topic/${encodeURIComponent(topicName ?? "")}`;
<Link to={backToTopicHref}>Back to {topic.name}</Link>
```

The href computed in code is correct, but the rendered click is being swallowed/redirected (most likely by the Lovable preview iframe shim that re-resolves in-app navigations and strips back to `/`). Direct navigation to the same URL works, so the routing config and `TopicPage` are fine — the problem is specifically with this `<Link>` click in the iframe.

## Fix

Replace the `<Link>` with an explicit programmatic navigation, which avoids the click-interception path entirely. Use the `navigate` hook that's already imported in the file.

In `src/pages/SubtopicPage.tsx`:

1. Replace the `<Link to={backToTopicHref}>` in the breadcrumb (around line 95–101) with a `<button>` that calls `navigate(backToTopicHref)` on click. Keep the same icon, label, and green `text-primary` styling so it still reads as interactive per the color contract.
2. Do the same for the `<Link to={backToTopicHref}>` in the "Subtopic not found" fallback (around line 76–81).
3. Leave `onToggleExpand={() => navigate(backToTopicHref)}` on `TopicPostExpanded` as-is (already programmatic, already works).

This keeps the destination identical (`/topic/{topicName}`) but routes through `react-router`'s imperative API, which is unaffected by the link-click interception causing the redirect to `/`.

## Acceptance

- From `/topic/Florida/post/1`, clicking "Back to Florida" lands on `/topic/Florida` (the topic list page) — not `/`.
- Same for every other subtopic (`/post/2`, `/post/3`, …) and every other topic.
- Visual styling of the back affordance is unchanged (chevron + green text + " / #N" suffix).
