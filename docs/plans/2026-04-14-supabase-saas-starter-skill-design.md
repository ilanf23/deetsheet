# Supabase SaaS Starter Skill — Design

**Date:** 2026-04-14
**Status:** Approved, ready for implementation
**Install location:** `~/.claude/skills/supabase-saas-starter/` (user-level)

## 1. Purpose & Scope

A Claude Code skill that scaffolds platform-admin dashboards and transactional email systems in Supabase-backed React/TypeScript SaaS projects. Built from Ilan's wishlist (not by porting Fireact), borrowing only Fireact's skill *structure* (project detection → state reading → playbooks → conventions → references).

**In v1 scope:**

- All 10 platform-admin features: user list, user detail + actions, impersonation, metrics, moderation, audit log, feature flags, system health, support inbox, role manager.
- Transactional email via Resend + React Email, covering all 8 email types (auth, welcome, invites, notifications, billing, digests, announcements, security) with hybrid triggering (Edge Functions default; pg_cron for scheduled; DB triggers for reactive).

**Deferred to v2+:**

- Auth flow UIs (signup/login/reset pages)
- Billing / Stripe integration
- Multi-tenancy / teams / orgs
- RBAC beyond admin-vs-user
- Onboarding flows, settings pages, file uploads, landing pages

**Target:** Any Supabase + React + TypeScript SaaS project (Vite or Next.js). Not DeetSheet-specific.

**Activation description:**

> Scaffold Supabase platform-admin dashboards (user management, impersonation, metrics, moderation, audit log, feature flags, roles) and transactional email systems (Resend, React Email, Edge Functions, pg_cron digests, DB-triggered notifications). Use when adding admin pages or email sending to Supabase + React/TypeScript SaaS projects.

## 2. File Layout

```
supabase-saas-starter/
├── SKILL.md                      # Entry: project detection, playbook index, global conventions
├── references/
│   ├── project-detection.md      # Verify Supabase+React project; state-reading table
│   ├── admin-playbooks.md        # All 10 admin playbooks
│   ├── admin-schema.md           # SQL migrations for new admin tables
│   ├── email-setup.md            # Resend config, env vars, React Email, Edge Function scaffold
│   ├── email-playbooks.md        # All 8 email-type recipes
│   ├── email-triggers.md         # pg_cron + DB-trigger-to-webhook patterns
│   └── conventions.md            # Shared patterns: toasts, RLS, admin gate, error handling
└── templates/
    ├── admin/                    # Canonical .tsx files to adapt
    │   ├── AdminUsersPage.tsx
    │   ├── AdminUserDetail.tsx
    │   ├── ImpersonationButton.tsx
    │   └── AuditLogPage.tsx
    ├── migrations/               # Raw SQL for new tables
    │   ├── audit_log.sql
    │   ├── feature_flags.sql
    │   └── support_tickets.sql
    └── edge-functions/
        ├── send-email/index.ts   # Full Edge Function scaffold
        └── react-email/          # React Email templates per type
            ├── Welcome.tsx
            ├── Invite.tsx
            ├── Notification.tsx
            ├── Digest.tsx
            ├── Announcement.tsx
            └── SecurityAlert.tsx
```

**Load strategy:** Claude always reads `SKILL.md`. References load on-demand per playbook. Templates are copied and adapted, not loaded as context.

## 3. Admin Playbooks

Every admin playbook in `references/admin-playbooks.md` follows a 6-step recipe:

```
1. Prerequisites — required tables, RLS, admin-role gate, env vars
2. Schema — SQL migration (linked to admin-schema.md) if a new table is needed
3. Supabase queries — exact .from().select() / .rpc() calls, incl. RLS notes
4. UI — which template in templates/admin/ to copy + what to customize
5. Route wiring — where to register the route, which admin-guard to wrap it in
6. Verification — SQL to run + UI smoke test + `npm run build`
```

**Ten playbooks:**

| # | Playbook | New table? | Flagged risk |
|---|----------|-----------|--------------|
| 1 | User list | — | RLS on `auth.users`; queries via service role in Edge Function |
| 2 | User detail + actions | — | Auth admin API needs service role; never client-side |
| 3 | Impersonation | `impersonation_sessions` | Audit every impersonation; time-box; never impersonate super-admins |
| 4 | Metrics dashboard | — | Use materialized views for MRR/active-users |
| 5 | Content moderation | `moderation_flags` | Soft-delete policy; restore window |
| 6 | Audit log | `audit_log` | Append-only (no UPDATE/DELETE RLS); partition by month at scale |
| 7 | Feature flags | `feature_flags` | Switch to PostHog/GrowthBook if flags become complex |
| 8 | System health | — | Document how to surface Sentry/Supabase status; no homegrown monitor |
| 9 | Support inbox | `support_tickets` | Consider Intercom/Plain before building |
| 10 | Role & permission manager | reads `user_roles` | Last-admin lockout guard |

## 4. Email Setup Foundation

`references/email-setup.md` covers infrastructure before individual types:

**A. Resend configuration**
- Install: `resend`, `@react-email/components`, `-D react-email`
- Env: `RESEND_API_KEY` (Edge Function secret), `EMAIL_FROM`, `APP_URL`
- Domain verification: SPF / DKIM / DMARC DNS records before production use
- Test mode: Resend sandbox addresses for local dev

**B. Shared `send-email` Edge Function** (`templates/edge-functions/send-email/index.ts`)
- Payload: `{ template, to, data }`
- Switches on `template` → renders React Email component → calls `resend.emails.send()`
- Returns `{ id }` or `{ error }`, never throws
- Logs every send to `audit_log` with `event_type='email_sent'`
- Verifies JWT (except unauthenticated flows → signed one-time token)

**C. React Email conventions** (`templates/edge-functions/react-email/`)
- One file per type, default-exports typed component
- Shared `<Layout>` wrapper (logo, footer, unsubscribe link)
- Plain-text fallback via `renderAsync(..., { plainText: true })`
- Preview text via `<Preview>` for inbox snippet
- All URLs use `APP_URL` — never hardcoded

**D. Local preview workflow**
- `npx react-email dev` → browser preview at localhost:3000
- **Mandatory before shipping**: skill refuses to mark email work "done" without preview confirmation

## 5. Email Playbooks

Each of 8 types in `references/email-playbooks.md` follows a 6-step recipe:

```
1. Trigger — what event fires this (auth hook, server action, DB trigger, pg_cron)
2. Template — React Email file to use
3. Payload — typed props
4. Call — exact Edge Function invocation
5. Idempotency — dedup key so retries don't double-send
6. Verification — preview locally + send to test address + check Resend dashboard
```

| Type | Trigger | Dedup key | Flagged gotcha |
|------|---------|-----------|----------------|
| Auth (verify / reset / magic) | Supabase Auth hook | Supabase-managed | Overriding defaults; keep token format identical |
| Welcome | Auth webhook on `email_confirmed` | `user_id` | Only after verified, not at signup |
| Team invite | Server action / Edge Function | `invite_id` | Token URL; 7d expiry |
| In-app notification | DB trigger → webhook → send-email | `notification_id` | Respect prefs; batch to prevent spam |
| Billing | Stripe webhook → send-email | `stripe_event_id` | Out of v1 for full billing; email side scaffolded |
| Digest | pg_cron → Edge Function | `user_id + period` | Materialized view; unsubscribe mandatory |
| Announcement | Admin UI → Edge Function (opt. pg_cron) | `campaign_id + user_id` | Rate-limit per Resend; batch queue |
| Security alert | DB trigger on `auth.audit_log_entries` | `event_id` | Never rate-limit; always deliver |

## 6. Conventions & Verification

`references/conventions.md`:

- **Admin-role gate:** `useRequireAdmin()` hook + `<AdminRouteGuard>` wrapper pattern
- **Toasts:** Sonner via `useToast()`; success/error/loading conventions
- **RLS check helper:** utility to assert RLS before deploying migrations
- **Error contract:** Edge Functions return `{ error }`, never throw across network
- **TypeScript types:** always `Tables<"name">` from generated types; never hand-roll
- **Service-role key guard:** referencing the service-role key from client-side code = skill hard-stops and warns

**Verification contract at end of every playbook:**

1. `npm run build` — no errors
2. `npm run lint` — no new warnings
3. Load the affected route in a browser
4. For email: preview template in `react-email dev`, send to test address, confirm delivery in Resend dashboard
5. For admin actions: verify via SQL that the DB state changed as expected

The skill refuses to claim work complete without producing output from these steps.

## Implementation Order (for the skill itself)

1. Scaffold skill directory + SKILL.md + frontmatter
2. Write `project-detection.md` + `conventions.md` (foundation)
3. Write `admin-schema.md` + all 3 SQL migration templates
4. Write `admin-playbooks.md` + all 4 admin React templates
5. Write `email-setup.md` + send-email Edge Function template
6. Write all 6 React Email template components
7. Write `email-playbooks.md` + `email-triggers.md`
8. Smoke test: run a fresh Claude session, ask it to "add an admin user list page to a Supabase project," verify it activates the skill and produces sensible output
