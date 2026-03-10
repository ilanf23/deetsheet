

# Plan: Sync Profile Image Across All Components

## Problem
When a user updates their profile image on the Profile page, it saves to the database but doesn't update the header avatar or other places showing the user's avatar. The `Profile.tsx` upload handler updates the DB but never calls `refreshProfile()` from AuthContext, so the header stays stale.

## Changes

### 1. `src/pages/Profile.tsx`
- Import `refreshProfile` from `useAuth()`
- After the avatar upload and DB update succeeds, call `await refreshProfile()` so the AuthContext picks up the new URL and the header avatar updates immediately

### 2. `src/pages/ProfileEdit.tsx`
- The cropped upload handler already calls `refreshProfile()` but does NOT save `avatar_url` to the database until form submit. Add an immediate DB update after upload (like Profile.tsx does) so the avatar persists even without clicking "Save"

### 3. `src/components/CommentItem.tsx` (no change needed now)
- Comments currently use seed data with hardcoded usernames, not real DB users. The avatar for the logged-in user's own comments would need the DB-backed avatar, but since comments aren't yet stored in DB with author profiles joined, this is a future concern. The current mock data won't reflect real avatars.

## Summary
Two small edits — one line addition in Profile.tsx and one line addition in ProfileEdit.tsx — to ensure avatar changes propagate to the header and persist to the database immediately.

