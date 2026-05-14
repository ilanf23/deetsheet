## Unified Admin Review Queue

Add a single inbox at `/admin/review` where the admin sees every pending topic and pending post in one chronological list and approves/rejects from the same screen. Author visibility stays as it is today (only author + admin can see their pending item).

### Scope

In scope:
- New "Review" admin page combining pending topics and pending posts.
- Sidebar entry with a live count badge for total pending items.
- Approve / Reject actions that write to the existing `status` column on `topics` and `posts`.
- A small preview of each item (title, author, category/topic, body excerpt, image thumb) so the admin can decide without leaving the page.

Out of scope (per your answers):
- Comments review.
- Email notifications to admin or author.
- Author-facing "My pending submissions" page.

### UX

Route: `/admin/review` (new). Becomes the default landing tab inside Admin.

Layout:
- Header: "Review queue" + total pending count.
- Filter pills: `All` · `Topics (N)` · `Posts (N)`.
- Sort: Newest / Oldest.
- List of cards, each showing:
  - Type badge (Topic | Post), submitted-time, author name + avatar.
  - For topics: name, category, description.
  - For posts: title, parent topic (linked), body excerpt, image thumb if any.
  - Right side: green `Approve` and red `Reject` buttons.
- Empty state: "Inbox zero — nothing waiting for review."
- Sidebar `Review` nav item shows a small coral pill with the pending count (auto-refreshes when items are approved/rejected).

The existing `/admin/topics` and `/admin/posts` pages stay as-is for browsing/filtering by status — Review is just the focused inbox.

### Data

No schema changes required. Both tables already have:
- `topics.status` ('pending' | 'approved' | 'rejected') with RLS gating public visibility.
- `posts.status` ('pending' | 'approved' | 'rejected') with RLS gating public visibility.

Approve/reject = `UPDATE … SET status = 'approved' | 'rejected' WHERE id = …` (admin-only, already covered by existing RLS).

### Technical notes

- New file: `src/pages/admin/AdminReview.tsx`.
- New hook (or inline query): fetch pending rows in parallel:
  - `supabase.from("topics").select("id, name, slug, category_name, description, created_at, created_by").eq("status", "pending")`
  - `supabase.from("posts").select("id, title, content, image_url, topic_id, author_id, created_at").eq("status", "pending")`
  - Join authors via `profiles` (name, username, avatar_url) and topic names via `topics` for posts.
- Merge into a discriminated union `{ kind: "topic" | "post", ... }`, sort by `created_at`.
- Approve/Reject mutations invalidate the queue and the per-type admin pages.
- Sidebar badge: lightweight count query (`select id … status=pending` on both tables) with a 30s `refetchInterval`, or refetch on review-page mutations.
- App routing: register the new route under the admin layout in `src/App.tsx`; add nav entry in `src/components/admin/AdminLayout.tsx` (top of the list, with `Inbox` icon from lucide).
- Reuse `StatusPill`, `AdminSortSelect`, and the existing admin design tokens (`--admin-*`).

### Files touched

- New: `src/pages/admin/AdminReview.tsx`
- Edited: `src/App.tsx` (lazy import + route)
- Edited: `src/components/admin/AdminLayout.tsx` (nav entry + count badge)
