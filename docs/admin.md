# Admin Current State

Last reviewed: 2026-05-01

## Purpose

This file is the handoff point for DeetSheet admin work. It captures what exists now, how access is controlled, and the main gaps to keep in mind before adding features.

## Entry Points

- Admin shell: `src/components/admin/AdminLayout.tsx`
- Route guard: `src/components/admin/AdminRouteGuard.tsx`
- Admin auth hook: `src/hooks/useAdminAuth.ts`
- Admin mode context: `src/hooks/useAdminMode.tsx`
- Routes: `src/App.tsx`

Admin routes are mounted under `/admin`:

- `/admin` -> dashboard
- `/admin/users` -> users table
- `/admin/posts` -> posts table
- `/admin/comments` -> comments table
- `/admin/topics` -> topic management

## Access Model

The visible admin area is protected by `AdminRouteGuard`, which calls `useAdminAuth()`.

`useAdminAuth()` checks `public.user_roles` for the current user's `admin` role:

```ts
supabase
  .from("user_roles")
  .select("role")
  .eq("user_id", user.id)
  .eq("role", "admin")
  .maybeSingle()
```

If the user is not signed in, they are redirected to `/login`. If they are signed in but do not have the admin role, they are redirected to `/`.

Admin mode is a UI toggle stored in `sessionStorage` under `admin_mode`. It controls whether admin links/buttons appear in the public header and footer, but it is not the security boundary.

## Database/RLS Notes

There are two admin concepts in the migrations:

- `public.user_roles` plus `public.has_role(user_id, role)` from `supabase/migrations/20260310213944_6758c4a3-70f7-4c31-81fa-3843cbb9f178.sql`
- `profiles.is_admin` plus `public.is_admin()` from `supabase/migrations/20260311000000_admin_support.sql`

The frontend route guard currently uses `user_roles`. Several RLS policies still use `public.is_admin()`, which reads `profiles.is_admin`. That means UI access and write permissions may diverge unless both are granted for the same admin user.

Known seed/grant:

- `supabase/migrations/20260311100000_grant_admin_ilan.sql` sets `profiles.is_admin = true` for `ilan@maverich.ai`.

Before relying on admin writes, confirm the admin user has both:

- `profiles.is_admin = true`
- a `user_roles` row with `role = 'admin'`

## Existing Pages

### Dashboard

File: `src/pages/admin/AdminDashboard.tsx`

Shows:

- total users, posts, comments, topics
- signups by month
- posts by week
- recent posts/comments activity

Data is fetched directly from Supabase in `useEffect`.

### Users

File: `src/pages/admin/AdminUsers.tsx`

Current capabilities:

- list profiles
- search by name, username, or email
- delete a profile row

Important limitation: deleting a profile row is not the same as deleting the Supabase Auth user. Full user deletion requires a privileged backend path, not the public browser client.

### Posts

File: `src/pages/admin/AdminPosts.tsx`

Current capabilities:

- list posts with topic names
- search by title
- filter by topic
- view post body in a dialog
- delete a post

The post view renders saved HTML with `dangerouslySetInnerHTML`, so upstream sanitization matters.

### Comments

File: `src/pages/admin/AdminComments.tsx`

Current capabilities:

- list comments with parent post title
- delete a comment
- manually decrement the parent post `comment_count`

The manual decrement can drift if other comment count logic changes. Prefer a database trigger/RPC for long-term consistency.

### Topics

File: `src/pages/admin/AdminTopics.tsx`

Current capabilities:

- list topics
- show per-topic post counts
- create topics
- edit topic name and subject
- delete topics

The delete confirmation warns that associated posts/comments may be cascade-deleted. Confirm actual foreign key behavior before changing this workflow.

## Patterns To Follow

- Use `@/integrations/supabase/client` for browser Supabase calls.
- Use existing shadcn/ui components from `@/components/ui`.
- Keep admin route pages under `src/pages/admin`.
- Add new navigation entries in `src/components/admin/AdminLayout.tsx`.
- Keep destructive actions behind `AlertDialog`.
- Use `useToast()` for user-facing operation results.

## Known Gaps / Next Work

- Unify admin authorization around one source of truth: preferably `user_roles` + `has_role`, or keep `profiles.is_admin` only if the whole app is updated consistently.
- Add a server-side path for privileged actions that cannot be done safely from the browser, especially deleting Auth users and future moderation tools.
- Add pagination to admin tables before datasets grow.
- Add audit logging for destructive admin actions.
- Add loading/error states per request on dashboard cards and charts instead of one all-or-nothing loading state.
- Avoid `any` for profile email access once generated Supabase types match the schema.
- Consider replacing client-side aggregate work with SQL views/RPCs if dashboard data grows.

## Admin Portal Specification Checklist

Document type: Functional + technical spec
Version: v0.1 - Draft, awaiting business requirement fill-in by Ilan
Last updated: 2026-05-01
Source contract: Independent Contractor Agreement Section 2.6, Admin / Superadmin Core System Build, plus Section 2.2, Homepage admin grid control
Source roadmap: Notion -> DeetSheet MVP Build Checklist, Phase 1
Stack assumption: Supabase Postgres + RLS, Next.js / Vite + React, shadcn/ui, `useAdminAuth`, `user_roles`

Tracking rule: mark an item complete only when the acceptance criteria are implemented and verified. Existing partial pages count as partial, not complete.

### Next Three Actionable Steps

1. [ ] Unify admin authorization around `user_roles` + `has_role`, update RLS policies that still depend on `profiles.is_admin`, and seed Fred/Ilan consistently.
2. [ ] Add the admin safety foundation: `audit_logs`, soft-delete/status fields, and server-side privileged actions for user management.
3. [ ] Build the core moderation workflow: post approval states, report queue, dashboard KPIs, and audit logging for approve/reject/resolve actions.

### Open Items

- [x] Scope items resolved as of 2026-05-01; no open blockers recorded.
- [x] Canonical terminology set to `admin`; SOW "admin" and "superadmin" mean the same MVP role.
- [x] MVP has one admin tier with full powers and no internal hierarchy.
- [x] Phase 2 deferral confirmed: email preferences have no schema and no UI in MVP.
- [x] Phase 2 deferral confirmed: AI-assisted comment enhancement has no MVP integration.

### Business Requirements

- [ ] Fill in the goal of the admin portal in 2-4 sentences.
- [ ] Fill in primary admin persona: Fred + Ilan.
- [ ] Define what admins do daily.
- [ ] Define what admins do weekly.
- [ ] Define what admins do rarely but must be possible.
- [ ] Define what pain the admin portal removes.
- [ ] Fill in secondary persona: non-admin end users.
- [ ] Define which admin actions affect end users and how those actions should feel.
- [ ] Define three measurable 90-day post-launch success criteria.

### Roles And Permissions

MVP roles are `admin` and `user`. There is no separate superadmin role in MVP.

- [ ] Enforce permissions with Supabase RLS on every protected table.
- [x] Enforce UI access with `useAdminAuth`.
- [ ] Verify app-level checks are not the only security layer.
- [x] Admin and user can sign up and log in.
- [x] Admin and user can edit their own profile.
- [ ] Admin and user can delete their own account.
- [ ] Admin can view all users with list, search, and filter.
  Current: partial. Admin users page has list and search; role/status filters are not built.
- [ ] User cannot view all users.
- [ ] Admin can view any user's full profile.
- [ ] User cannot view another user's private/full admin profile.
- [ ] Admin can change a user's role.
- [ ] User cannot change roles.
- [ ] Admin can ban, suspend, and unban a user.
- [ ] User cannot ban, suspend, or unban users.
- [ ] Admin can force-reset a user's password through a privileged backend path.
- [ ] User cannot force-reset another user's password.
- [ ] Admin and user can create posts.
- [ ] Admin and user can view their own posts.
- [ ] Admin can view all posts, including pending and draft where applicable.
- [ ] User cannot view other users' pending/draft posts.
- [ ] Admin can approve pending posts.
- [ ] User cannot approve pending posts.
- [ ] Admin can reject pending posts.
- [ ] User cannot reject pending posts.
- [ ] Admin can edit any post.
- [ ] User can edit only their own posts.
- [ ] Admin can delete any post.
- [ ] User can soft-delete only their own posts.
- [ ] Admin can restore soft-deleted posts.
- [ ] User cannot restore soft-deleted posts.
- [ ] Admin can pin or feature posts.
- [ ] User cannot pin or feature posts.
- [ ] Admin and user can create comments.
- [ ] Admin can edit any comment.
- [ ] User can edit only their own comments.
- [ ] Admin can delete any comment.
- [ ] User can soft-delete only their own comments.
- [ ] Admin can create, edit, and archive topics.
- [ ] User cannot create, edit, or archive topics.
- [ ] Admin can reorder topics.
- [ ] User cannot reorder topics.
- [ ] Admin and user can submit reports.
  Current: partial. Post reports exist with dedupe by user/post; comment/user reporting and full reason taxonomy are not built.
- [ ] Admin can view the report queue.
- [ ] User cannot view the report queue.
- [ ] Admin can resolve and dismiss reports.
- [ ] User cannot resolve or dismiss reports.
- [ ] Admin can edit hero, featured, and topic-page content with block-level inline editing.
- [ ] User cannot edit live page content.
- [ ] Admin can adjust homepage grid layout.
- [ ] User cannot adjust homepage grid layout.
- [ ] Admin can view admin dashboard overview.
- [ ] User cannot view admin dashboard overview.
- [ ] Admin can view basic platform metrics.
- [ ] User cannot view basic platform metrics.
- [ ] Admin can view audit log.
- [ ] User cannot view audit log.
- [ ] Admin can perform bulk actions such as deleting posts and banning users.
- [ ] User cannot perform admin bulk actions.

### Content Model

#### User

- [ ] Add/confirm fields: `id`, `email`, `username`, display name, avatar, bio, expertise topics, location, role, `created_at`, `updated_at`, `last_seen_at`, status, `banned_until`, `ban_reason`.
- [ ] Support states: `active`, `suspended`, `banned`, `deleted`.
- [ ] Implement lifecycle: sign-up -> email verified -> active -> suspended/banned -> reactivated or hard-deleted.
- [ ] Keep deleted users soft-deleted for a 30-day restore window.

#### Post

- [ ] Add/confirm fields: `id`, `author_id`, `topic_id`, `subtopic_id`, subject <= 50 characters, detail <= 100 characters, `image_url`, `preface_type`, status, `view_count`, `rating_avg`, `created_at`, `updated_at`, `published_at`, `approved_by`, `deleted_at`.
- [ ] Support states: `draft`, `pending_approval`, `published`, `rejected`, `archived`, `deleted`.
- [ ] Implement lifecycle: user submits -> pending approval -> admin approves or rejects with reason -> admin can archive or soft-delete.

#### Comment

- [ ] Add/confirm fields: `id`, `post_id`, `author_id`, `parent_comment_id`, body, status, `upvote_count`, `downvote_count`, `created_at`, `updated_at`, `deleted_at`.
- [ ] Support states: `published`, `hidden`, `deleted`.

#### Topic

- [ ] Add/confirm fields: `id`, name, slug, `parent_topic_id`, description, `image_url`, `sort_order`, status, `created_at`, `updated_at`.
- [ ] Support states: `active`, `archived`.

#### Report

- [ ] Add table/confirm fields: `id`, `reporter_id`, `target_type`, `target_id`, reason, notes, status, `resolved_by`, `resolution_action`, `created_at`, `resolved_at`.
  Current: partial. Existing `reports` table supports `user_id`, `post_id`, `reasons`, and `created_at` only.
- [ ] Support states: `open`, `under_review`, `resolved`.
- [ ] Support resolution actions: dismissed, post deleted, user warned, user banned.

#### AuditLog

- [ ] Add append-only audit log table.
- [ ] Add fields: `id`, `actor_id`, action, `target_type`, `target_id`, `before_value` jsonb, `after_value` jsonb, `ip_address`, `user_agent`, `created_at`.
- [ ] Enforce immutable audit log behavior.
- [ ] Retain audit logs for at least 12 months.

### Workflows

#### Post Approval

- [ ] User submits post and post enters `pending_approval`.
- [ ] System notifies admins in-app; optional email can wait unless chosen for MVP.
- [ ] Pending post is invisible to non-admin users.
- [ ] Admin approval queue sorts oldest-first.
- [ ] Admin can approve a pending post.
- [ ] Approving sets status to `published`.
- [ ] Approving sets `published_at = now()`.
- [ ] Approving sets `approved_by = admin_id`.
- [ ] Approving writes an audit log entry.
- [ ] Admin can reject a pending post with a reason.
- [ ] Rejecting sets status to `rejected`.
- [ ] Rejected post stays invisible to feed.
- [ ] Rejected post remains visible in author's rejected tab.
- [ ] Author can edit and resubmit a rejected post.

#### Report To Moderation

- [ ] User can report post, comment, or user.
- [ ] Report modal includes reason taxonomy: spam, harassment, off-topic, other.
- [ ] Report modal includes optional notes.
- [ ] Report submission creates a row with status `open`.
- [ ] Admin report queue groups duplicate target reports.
- [ ] Report queue sorts by report count descending, then oldest-first.
- [ ] Admin can dismiss a report.
- [ ] Admin can hide content from report queue.
- [ ] Admin can delete content from report queue.
- [ ] Admin can warn user from report queue.
- [ ] Admin can ban user from report queue with duration.
- [ ] Resolution sets status to `resolved` and records `resolution_action`.
- [ ] Resolution writes an audit log entry.
- [ ] Reporter can optionally be notified of resolution.

#### User Ban And Suspend

- [ ] Admin user detail/actions menu includes suspend for 1 day, 7 days, and 30 days.
- [ ] Admin user detail/actions menu includes indefinite ban.
- [ ] Admin user detail/actions menu includes unban.
- [ ] Suspend sets user status to `suspended`.
- [ ] Suspend sets `banned_until` to now plus duration.
- [ ] Suspended user can log in but cannot post/comment until suspension expires.
- [ ] Suspension auto-reverts to active when `banned_until` passes.
- [ ] Ban sets user status to `banned`.
- [ ] Ban clears `banned_until` for indefinite ban.
- [ ] Banned user cannot log in and sees ban reason plus appeal instructions.
- [ ] Every suspend, ban, and unban writes an audit log entry with reason.
- [ ] Optional notification email can be sent to affected user.

#### Live Page Editing

- [ ] Admin can toggle edit mode from an admin toolbar.
- [ ] Editable blocks show hover outline in edit mode.
- [ ] Admin can click editable text block and edit inline.
- [ ] Admin can click editable image block and upload/swap image.
- [ ] Save performs optimistic update, persists to DB, and writes audit log entry.
- [ ] Cancel reverts local changes.
- [ ] Non-admin users never see edit mode toggle.
- [ ] Non-admin users see editable blocks as normal content only.

### Functional Requirements

#### Phase 1 Build Rows

- [ ] 1. Admin role-based access.
  Current: partial. `user_roles`, `useAdminAuth`, and admin route gating exist, but RLS/source-of-truth mismatch must be resolved.
  Acceptance: non-admin hitting any admin route gets blocked; admin gets page; RLS rejects unauthorized DB mutations if client is bypassed.

- [ ] 2. Admin dashboard overview.
  Current: partial. Dashboard exists, but KPI set and deep links do not match final spec.
  Acceptance: `/admin` shows pending approvals, open reports, new users 24h, posts 24h, and quick links; live counts load in under 500ms with seeded data.

- [ ] 3. Manage users.
  Current: partial. List/search/delete profile row exists.
  Acceptance: paginated list with search by email/username, filters by role/status, view, change role, suspend, ban, force-reset; search under 300ms on 10k seeded users; audit log records every action.

- [ ] 4. Manage posts.
  Current: partial. List/search/topic filter/view/delete exists.
  Acceptance: tabs for Pending, Published, Reported, Rejected, Deleted; filters by topic/author/date range; approve, reject, edit, soft-delete, restore; approval visible on feed within 1 second.

- [ ] 5. Manage comments.
  Current: partial. List/delete exists.
  Acceptance: filters by post, author, status; hide, soft-delete, restore; hidden comment renders as "[Removed by moderator]"; deletion reversible within 30 days.

- [ ] 6. Manage topics.
  Current: partial. CRUD exists.
  Acceptance: CRUD plus drag-to-reorder; parent/child topics; reorder persists immediately; archive removes from feed but preserves posts; cannot delete topic with active posts.

- [ ] 7. Review reported content.
  Current: not built.
  Acceptance: grouped report queue; resolution actions from moderation workflow; audit log entry and optional reporter notification.

- [ ] 8. Basic analytics.
  Current: partial dashboard charts exist.
  Acceptance: DAU, WAU, posts/day, comments/day, top topics by post count, top users by post count, sign-ups/day; 7d/30d/90d selector; charts render under 2s; data accurate within 5 minutes.

- [x] 9. Email preferences/settings deferred to Phase 2.
  Acceptance: no schema, no UI, no email send infrastructure in MVP.

- [ ] 10. Post/comment report flow.
  Current: partial. Post report submission exists with `reports` rows and user/post dedupe; comment report buttons, final taxonomy, rate limiting, and admin queue are not built.
  Acceptance: report button on every post and comment; reason modal; creates `Report`; max 5 reports per user per hour; duplicate reports by same user on same target deduped.

#### SOW Section 2.6 Mapping

- [ ] 11. Edit photos and text directly within admin environment.
  Acceptance: hero, featured, topic pages, posts, comments, and topic descriptions editable through inline edit or admin form views.

- [ ] 12. Live page editing for content updates without redevelopment.
  Acceptance: admin can change hero copy, swap featured image, and edit topic descriptions without engineering; changes go live immediately.

- [ ] 13. Post approval workflow for every post.
  Acceptance: no post enters public feed until approved; queue empty state renders cleanly; target SLA is no post sits over 24 hours.

- [ ] 14. Controls for moderation, section visibility/ordering, and layout adjustments.
  Acceptance: moderation workflow, topic archive, featured-post pinning, and homepage grid control each have clearly labeled admin UI.

- [ ] 15. Lightweight CMS for topics, posts, and structure.
  Acceptance: routine content CRUD is possible from admin UI without SQL.

- [ ] 16. Move admin beyond read-only into actionable control.
  Current: partial. Existing list views have some row actions.
  Acceptance: every admin list view has at least one mutation action; no admin page is purely informational.

- [x] 17. Email preference settings deferred to Phase 2.
  Acceptance: no schema and no UI in MVP; decision logged 2026-05-01.

#### SOW Section 2.2 Mapping

- [ ] 18. Admin edit/grid control for layout flexibility.
  Acceptance: homepage layout mode can rearrange 3-column module order, hide/show modules, adjust module heights, persist per page for all users, save changes, and reset to default.

### CMS Standards

- [ ] Audit logging on every admin action: who, what, when, target, before/after values.
- [ ] Audit log is append-only with 12-month retention minimum.
- [ ] Soft delete with restore window, default 30 days for posts, comments, and users.
- [ ] Hard delete is separate and requires explicit secondary confirmation.
- [ ] Two-layer permission enforcement: Postgres RLS plus `useAdminAuth`.
- [ ] Optimistic concurrency on edits using `updated_at`.
- [ ] Stale writes are rejected with a reload prompt instead of silent overwrite.
- [ ] Bulk actions require confirmation showing affected scope.
- [ ] Every list view has full-text search by primary identifier.
- [ ] Every list view has pagination: default 25 rows, max 100.
- [ ] Destructive operations are rate-limited per admin.
- [ ] Most destructive confirmations require typed confirmation.
- [ ] Every list view has a designed empty state.
- [ ] Lists use skeleton loading states.
- [ ] Mutation errors show toast errors with retry path.
- [ ] Queue keyboard shortcuts exist for power users: `j`/`k`, `a`, `r`.
- [ ] Admin is mobile-readable and desktop-optimized.
- [ ] No mutation fails silently; every mutation returns success or error with recovery path.

### Out Of Scope For MVP

- [x] Multiple admin tiers deferred; schema may be future-proofed, no MVP UI.
- [x] Trusted-user post-approval bypass deferred; every post queues in MVP.
- [x] Full WYSIWYG layout editor / drag-drop page builder deferred; block-level inline only.
- [x] Subject autofill on post creation deferred.
- [x] AI-assisted comment enhancement deferred to Phase 2.
- [x] Email preferences UI, digest emails, and notification system deferred to Phase 2.
- [x] Third-party admin tools API deferred.
- [x] External moderation webhooks deferred.
- [ ] Revisit 2FA for admin accounts before launch.
- [x] Admin invitation/onboarding flow deferred; MVP assumes Fred and Ilan are seeded directly in DB.

### Acceptance Test Plan

Detailed tests should be authored after the business requirements are filled in.

- [ ] For each requirement 1-18, write a permission test where non-admin attempts the action and fails at RLS.
- [ ] For each requirement 1-18, write a happy-path test where admin performs the action, expected state changes, and audit log is written.
- [ ] For each requirement 1-18, write an edge-case test covering concurrency, soft-delete recovery, or rate-limit enforcement.

### Sign-Off

- [ ] Fred signs off as client.
- [ ] Ilan signs off as builder.
