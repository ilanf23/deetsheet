## Goal

Let users mark a post as anonymous when creating (or editing) it, and hide their identity in every place the post is rendered.

The database already supports this — `posts.is_anonymous` exists and the admin edit dialog already toggles it. Today the user-facing create flow hardcodes `is_anonymous: false`, and no display surface honors the flag. This plan closes both gaps.

## Scope

Posts only (comments stay attributed — confirm if you want that included).

## Changes

**1. Create / edit UI**
- `CreatePostDialog.tsx`: add a "Post anonymously" checkbox under the form, with a short helper line ("Your username and avatar won't be shown on this post").
- `EditPostDialog.tsx`: same checkbox, prefilled from the post's current `is_anonymous` value, so users can toggle later.
- `useCreatePost.ts`: accept and persist `is_anonymous` instead of the hardcoded `false`.

**2. Display — replace author with "Anonymous" when `is_anonymous` is true**
- `PostCard.tsx` (homepage / lists)
- `TopicPostListItem.tsx` (topic page rows)
- `post/AuthorByline.tsx` and `post/PostHeader.tsx` (post detail page)
- `UserPostsList.tsx` (profile "My Posts") — author shouldn't be linked
- `RecentlyAddedSidebar.tsx` / `TopicRecentlyAdded.tsx` if they show a byline

In each spot: show "Anonymous" as plain dark text (not the green link style), use a neutral placeholder avatar, and remove the link to the author's profile.

**3. Author-side affordance**
- On the owner's own profile "My Posts" list, still show the post (the owner needs to manage it) but mark it with a small "Anonymous" badge so they remember it's posted that way.

**4. Admin**
- No change. Admin edit dialog already exposes the toggle.

## Out of scope (flag if you want them)

- Comments: stay attributed to the user.
- Ratings / favorites: stay attributed (only post author identity is hidden).
- Retroactively anonymizing existing posts (admins can already do this per-post).

## Privacy note

`is_anonymous` only hides the author in the UI — the `author_id` column is still stored so the user can edit/delete their own post and admins can moderate. That matches how the admin tool works today. Let me know if you want stronger anonymity (e.g. strip `author_id` from public reads via a view) and I'll add that.
