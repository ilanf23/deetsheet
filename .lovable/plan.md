
## Admin Messaging (Phase 1)

Scope confirmed: **Admin → User only.** Users get an inbox to read/reply on messages admin sent, but user↔user DMs and user-initiated threads to admin are out of scope for this build. Every send goes to both the platform inbox and the user's email. Deadline is display-only.

---

## 1. Data model (Supabase migration)

New tables in `public`:

- **`message_threads`** — one row per admin↔user conversation, scoped by `post_id` (nullable so we can support non-post threads later).
  - `user_id uuid → auth.users`, `post_id uuid → posts (nullable)`, `subject text`, `status text` (`open` | `needs_contact` | `resolved`), `last_message_at timestamptz`, `last_sender text` (`admin` | `user`), timestamps.
  - Unique on `(user_id, post_id)` when `post_id` is not null.

- **`messages`** — every message in a thread.
  - `thread_id → message_threads`, `sender_id uuid` (admin user id, or the recipient user id for their reply), `sender_role text` (`admin` | `user`), `body_html text`, `body_text text`, `slip jsonb` (stores structured review-slip fields: `reason`, `suggestions`, `deadline_text`, `post_status_snapshot`), `email_sent bool`, `email_message_id text`, `created_at`.

- **`message_templates`** — admin-managed form letters.
  - `title text`, `subject text`, `body_html text`, `reason_default text`, `suggestions_default text`, `deadline_default text`, `created_by uuid`, timestamps.

RLS + GRANTs (following the required 4-step structure):
- `message_threads` / `messages`: users can SELECT their own threads/messages (`user_id = auth.uid()`); admins (`has_role(auth.uid(),'admin')`) can SELECT/INSERT/UPDATE all. Only admins INSERT into threads; users may INSERT messages only into threads they own (reserved for Phase 2 replies but policy added now).
- `message_templates`: admin-only read/write.
- All three: `GRANT` to `authenticated` + `service_role`; no `anon`.
- Add `update_updated_at_column` trigger + a trigger on `messages` INSERT that updates `thread.last_message_at`, `last_sender`, and bumps `status` to `needs_contact` when user replies / `resolved` clearable by admin.

## 2. Email delivery

Reuse existing `send-email` edge function (already uses Resend + `noreply@deetsheet.com`). New edge function **`send-admin-message`** (verify_jwt=false, validates admin role in code via service role + JWT decode):
- Input: `thread_id?`, `user_id`, `post_id?`, `subject`, `body_html`, `slip {reason, suggestions, deadline_text}`, `template_id?`.
- Creates/reuses thread, inserts message row, renders branded HTML email (review-slip layout mirroring the in-app card: STATUS / POST / REASON / SUGGESTIONS / DEADLINE), calls `send-email`, stores `email_message_id` + `email_sent`.
- Errors surface to admin toast; message row still persists on email failure with `email_sent=false` so admin can retry.

## 3. Admin UI — `/admin/messages`

Add route + nav entry in `AdminLayout`. Page structure mirrors the reference screenshot:

- **Header:** "Messaging" title + "Manage form letters" button (opens templates dialog).
- **Toolbar:** search input (user or post), pill filters `Needs contact (n)` / `All`, sort dropdown (Recently edited / Oldest).
- **Table:** columns USER (avatar + name), POST (title in quotes), STATUS (Pending / Re-review / Resolved badge), LAST CONTACT (`Jul 8 · no reply` style), row action `Compose ▼`.
- **Expanded compose row** (inline, like reference): blue "REVIEW SLIP" panel with editable STATUS / POST / REASON / SUGGESTIONS / DEADLINE fields, template picker, "Also send as email" checkbox (default checked, non-blocking hint that it's always on for now), `Send slip` primary button.
- **Manage form letters dialog:** CRUD on `message_templates`.

Data source: join `message_threads` with latest message + user profile + post title. Uses TanStack Query with existing patterns. Auto-seed threads on-demand: when admin opens compose on a post that has no thread yet, thread is created on send.

Integration hook: in `AdminReview.tsx`, add a "Message author" button beside Approve/Reject/Edit that deep-links to `/admin/messages?post=<id>&compose=1`.

## 4. User inbox — `/inbox`

Minimal read + reply surface for users (kept small for Phase 1):
- Nav entry in `DeetHeader` user menu with unread count badge (threads where `last_sender='admin'` and user hasn't opened since `last_message_at`; tracked via `last_read_at` on `message_threads`).
- List of threads → thread detail page showing review-slip rendering of admin messages + reply composer (plain textarea, posts a `messages` row with `sender_role='user'`).
- No new-thread action for users in Phase 1.

## 5. Files

**New**
- `supabase/functions/send-admin-message/index.ts`
- `src/pages/admin/AdminMessages.tsx`
- `src/components/admin/MessageComposeRow.tsx`
- `src/components/admin/ManageTemplatesDialog.tsx`
- `src/pages/Inbox.tsx`, `src/pages/InboxThread.tsx`
- `src/hooks/useMessageThreads.ts`, `src/hooks/useUnreadMessages.ts`
- `src/lib/messageEmailTemplate.ts` (HTML renderer for the slip)

**Edited**
- Migration (tables, RLS, triggers, GRANTs)
- `src/App.tsx` (routes: `/admin/messages`, `/inbox`, `/inbox/:threadId`)
- `src/components/admin/AdminLayout.tsx` (nav item)
- `src/components/DeetHeader.tsx` (inbox link + unread badge)
- `src/pages/admin/AdminReview.tsx` ("Message author" button)

## 6. Out of scope (Phase 2 candidates)
User↔user DMs, user-initiated threads to support, auto-delete cron for deadlines, real-time updates (Phase 1 polls on focus), attachments, template variables `{{post_title}}` etc. (Phase 1 renders raw strings, admin edits per send).

## 7. Verification
- Send a slip from `/admin/messages` → row appears in `messages`, email delivered via Resend, thread status becomes `open`.
- Log in as recipient → `/inbox` shows thread, badge count matches, opening clears badge.
- Reply as user → thread status flips to `needs_contact`, appears in admin "Needs contact (n)" filter.
- RLS check: second non-admin user cannot read the first user's threads (query via supabase read_query as that user).
