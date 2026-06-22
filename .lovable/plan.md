## Hide anonymous posts from other users on profile

**Problem:** When viewing someone else's profile, their posts marked as anonymous are visible and attributed to them — defeating the purpose of "Anonymous."

**Fix:** In `src/components/UserPostsList.tsx`, when the viewer is NOT the profile owner (`!isOwnProfile`), exclude posts where `is_anonymous = true`.

Change the Supabase query to add:
```ts
if (!isOwnProfile) {
  query = query.eq("status", "approved").eq("is_anonymous", false);
}
```

The profile owner still sees all their own posts (including anonymous ones, with the existing "Anonymous" pill) so they can manage them.

**Also need (server-side safety):** Add an RLS-friendly approach. Right now `posts` is publicly readable, so a determined user could still query the DB directly. I'll add a SELECT policy adjustment so that anonymous posts are only returned to (a) the author and (b) admins — anyone else sees them only via aggregated/topic feeds where `author_id` is hidden in the UI.

Specifically, update the public SELECT policy on `posts` to:
- Allow read if `is_anonymous = false`, OR
- `author_id = auth.uid()`, OR
- `has_role(auth.uid(), 'admin')`

This way the data layer also enforces the privacy, not just the UI.

**Note:** This affects only the profile "My Posts" list. Anonymous posts continue to appear in topic feeds and on post pages as "Anonymous" (no author link), which is existing behavior.

**Files touched:**
- `src/components/UserPostsList.tsx` — add the filter for non-owner views.
- One migration updating the `posts` SELECT policy.
