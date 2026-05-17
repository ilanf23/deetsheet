# Show all profile-edit content on the profile view

Goal: anything a user fills out in `/profile/edit` should be visible on `/profile` (ProfileView). Today, several fields are collected but never displayed.

## Audit — what's missing on ProfileView

Already shown: name, username, email-ish (avatar/header), bio, sex, age (derived), city, city_born, college, high_school, degree+major (as sub-line), job, entity_type (only when "business"), favorite_movie, reading, joined date, credentials.

Missing / partially hidden:
1. **State** and **Country** — currently mashed into the "city" string only when present; `state` alone (no city) is dropped. Show them as discrete fields.
2. **Full date of birth** — only `age` is derived; the actual birthday (month/day/year) is never shown.
3. **Account type (`entity_type`)** — only rendered when value is "business". Should show whenever set (Person / Business / etc.).
4. **Education level** (`education` enum: bachelors, masters, …) — only rendered when both `college` and `high_school` are blank. Should always show as a labeled line in the Education card.
5. **Degree** and **Major** — shown only as a sub-line *under* college. If user filled degree/major but no college, they're invisible. Show them regardless.
6. **Expertise topics** — collected in ProfileEdit (`expertiseTopics`) but not persisted to the DB and not shown. Out of scope unless we add persistence (see Technical notes).
7. **Credentials** — already shown; values currently only populate from a LinkedIn import (not persisted by the form save). Flagged in Technical notes; no UI change needed.

## Changes

### `src/pages/ProfileView.tsx`

- **Quick-facts strip (around line 390):** add chips for full DOB (formatted "Month D, YYYY") and account type when not "person".
- **Location line:** keep the comma-joined "City, State, Country" but also render state-alone or country-alone if city is empty (so nothing filled gets dropped).
- **Education card (around lines 438-485):**
  - Always show `education` level (humanized label) as the first row.
  - Render `degree` / `major` as their own row even when `college` is empty.
- **Work card (around lines 487-509):** show `entity_type` always (not just when "business").
- **Bio section:** unchanged (already shows when present).
- **"A little about me" section:** unchanged (already shows favorite_movie / reading).

No new sections or design changes — just stop hiding filled fields. Empty fields keep self-hiding (existing pattern).

## Technical notes

- `entity_type`, `birth_month/day/year`, `state`, `country`, `education`, `degree`, `major` already exist on `profiles` and are already selected by `PROFILE_COLUMNS`. No DB or query changes needed.
- **Expertise & Credentials persistence:** ProfileEdit currently does NOT save `credentials` or `expertiseTopics` to the database — they only get populated transiently from the LinkedIn-import dialog. To make these "visible on the profile" durably we'd need to:
  - Add `credentials jsonb` and `expertise_topics text[]` columns to `profiles`.
  - Persist them in `onSubmit` in `ProfileEdit.tsx`.
  - Read them in `ProfileView`.
  This is a separate, larger change. **I'll skip it in this pass unless you confirm you want it included.**

## Out of scope
- Visual redesign of the profile.
- Persisting credentials / expertise to the database (call out above).
- Any change to ProfileEdit form itself.
