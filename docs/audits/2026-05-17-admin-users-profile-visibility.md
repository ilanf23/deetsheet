# Audit: Admin Users Profile Visibility

Date: 2026-05-17

Reported issue:

> My original profile and login still works but I’m not seeing my profile in the admin under Users.

## Conclusion

The report is plausible and there is no in-app audit-log evidence that the admin caused it.

The app can allow a user to log in successfully while the Admin > Users screen does not show what the admin expects, because login is sourced from Supabase Auth sessions while the Users screen is primarily sourced from `public.profiles`.

I could not fully prove the Auth-side login state or deletion history from this repository alone because the local environment only has the publishable key, not direct service-role access to `auth.users` or Supabase Auth logs.

## Evidence Reviewed

- `src/contexts/AuthContext.tsx` treats Supabase Auth session state as the source of login. It sets `user` from `supabase.auth.onAuthStateChange()` and `supabase.auth.getSession()`.
- `src/pages/admin/AdminUsers.tsx` fetches display rows from `public.profiles`, ordered by `created_at`.
- `supabase/migrations/20260307165354_ac3687e7-027e-4e83-9366-fcd57072fb69.sql` originally creates `public.profiles` as a table linked to `auth.users`, with a trigger intended to create profile rows after Auth user creation.
- Live read-only query of `public.profiles` returned 34 profile rows.
- Live read-only query for names/usernames containing `ilan` returned:
  - `b4c4496f-55a0-49b8-ae5b-337826cd19b9`, username `Ilan23`, created `2026-05-16T17:15:07.487074+00:00`
  - `a61ea24c-0c6a-4eed-b498-82a69c963897`, username `Ilan_Fridman`, name `Ilan Fridman`, created `2026-03-09T18:14:22.65576+00:00`
- Live read-only query of `public.audit_logs` with the app’s expected columns returned zero rows.
- A query for `profiles.email` failed with `column profiles.email does not exist`, despite an older migration file adding that column. The live database schema and migration files are not fully aligned.

## What This Means

The statement "my login still works" can be true without proving that the corresponding row is visible in Admin > Users. Auth users and profile rows are separate records:

- Supabase Auth controls login.
- `public.profiles` controls what the current Users screen lists.
- If a profile row is missing, not created by trigger, filtered out, not joined to Auth email, or searched by an unavailable email value, login can still work while Admin > Users appears incomplete.

For an `ilan` profile specifically, the live profile table does contain two matching profile rows, including an older `Ilan_Fridman` profile. If that is the reported "original profile," then the profile row itself exists in `public.profiles`; the issue is more likely UI lookup/search/expectation than an actual missing profile row.

## Did The Admin Cause It?

No evidence from the app’s audit trail indicates the admin caused this.

The `audit_logs` table is empty from the read-only query. That rules out logged in-app admin moderation actions as the cause, but it does not rule out:

- Supabase Studio changes.
- SQL changes made outside the app.
- Auth user changes not captured in `public.audit_logs`.
- Edge Function behavior not logged by `audit_logs`.

The current code path also does not show a completed "delete user" or "ban user" implementation in Admin > Users that would remove a profile. The screen has UI actions, but profile deletion is not wired as an active admin action in the reviewed code path.

## Likely Causes

1. Admin Users is a profile report, not a complete Auth users report.
2. Email visibility/search has been unstable:
   - The live `profiles.email` column does not exist.
   - The current Users screen relies on the `admin-list-users` Edge Function to map Auth user IDs to emails.
   - If that function is not deployed or the caller lacks an admin role row, email mapping will fail and email search will not find the user.
3. The live `user_roles` query with the publishable key returned no rows, so admin role visibility depends on authenticated context and RLS. A missing `user_roles` row could also break privileged admin helpers.
4. The local migrations and live database are out of sync, which increases the chance that the admin UI is assuming columns or functions that production does not have.

## Recommended Follow-up

- Verify the exact user identifier: email, Auth user ID, username, and profile ID.
- In Supabase SQL editor with service-role/admin privileges, compare Auth users to profile rows:

```sql
select
  u.id,
  u.email,
  u.created_at as auth_created_at,
  p.id is not null as has_profile,
  p.username,
  p.name,
  p.created_at as profile_created_at
from auth.users u
left join public.profiles p on p.id = u.id
where u.email ilike '%REPLACE_WITH_EMAIL%'
   or p.username ilike '%REPLACE_WITH_USERNAME%'
   or p.name ilike '%REPLACE_WITH_NAME%';
```

- Check whether `supabase/functions/admin-list-users` is deployed and has `SUPABASE_SERVICE_ROLE_KEY` configured.
- Add explicit error handling in `AdminUsers.tsx` for `admin-list-users` failures so admins can see when email/Auth mapping failed instead of assuming the user is missing.
- Consider adding a protected admin RPC or Edge Function that returns Auth users left-joined to profiles and highlights `missing_profile = true`.
