# Answers: TanStack Start migration for per-post share previews

No files changed and no migration started. This is only an answer. If you approve it, I won't start anything: say "migrate" when you want to go ahead.

## 1. Stack and eligibility
- This is a Classic Lovable project: Vite 5, React 18, React Router 6, a browser-only single-page app, with Lovable Cloud as the backend.
- That makes it eligible for "Migrate to TanStack Start". Start it from "/" in chat, from Project settings → Project actions, or by asking me.

## 2. Per-post and per-topic previews
Yes. After migrating, the routes `/topic/$topic` and `/topic/$topic/post/$slug` can load the post or topic on the server and send the page's own og:title, og:description and og:image in the first HTML. That first HTML is what Facebook, LinkedIn, X and iMessage read.
- Title: post title, or topic name.
- Description: a short plain-text excerpt of the post, or the topic subtitle.
- Image: the post photo, then the topic photo, then the default og-image.jpg.
- og:url can then point to each page itself.
- The server can only read data that logged-out visitors can see: approved, public posts. Pending, denied or anonymous-author details stay hidden. That is the right behavior for previews.
- Already-scraped links will keep their old preview until each platform re-fetches them. Facebook's Sharing Debugger can force a refresh.

## 3. Browser-only code that could break server rendering
- `src/main.tsx` reads `localStorage` ("theme") right when the app starts. This must move into a browser-only step.
- Lovable Cloud sign-in stores its session in localStorage. On the server it has to run without a session, and the logged-in experience loads in the browser after the page arrives.
- The TipTap editor (post editing): it needs browser-only loading or `immediatelyRender: false`.
- react-easy-crop (avatar and image cropping): browser-only. Render it only inside dialogs on the client.
- recharts (admin charts): usually fine when it renders after load, so it is low risk.
- embla carousel (hero banner): this one is low risk too.
- About 34 files touch `window`, `document` or `localStorage`. Most do it inside effects or event handlers, which is safe. Each one still needs a check: ScrollRestoration, useInfiniteList, useIsMobile, the analytics snippet, theme, scroll restore and admin mode.
- React Router is replaced by file-based routes: about 25 pages, plus admin routes and the old-topic-link redirects. This is the biggest piece of work.
- The backend functions and the database are unaffected.

**Risk: moderate.** No single library blocks the migration. The risk comes from the size of the routing rewrite, plus small mismatches between what the server and the browser draw: theme, mobile checks, signed-in header. Scroll restoration and the infinite lists need retesting.

## 4. Credits, time, rollback
- I can't give an accurate credit figure. Building costs depend on how complex the work is and how many fix-up rounds it needs. For an app this size, expect several messages: the migration itself, then fixes for each area found broken.
- Time: the main migration runs in one session. Then allow a day or two of testing key flows: sign-in, posting, review, messaging, admin, old links.
- Rollback: revert the migration message from chat history, and the project returns to the current Classic version. Publishing switches to the new system only after a clean build. Don't publish until testing is done; the live site stays on the current version until then.
- Recommended order: migrate, add the server-side previews to the post and topic pages, test with Facebook's Sharing Debugger, then publish.
