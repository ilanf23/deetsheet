# Project conventions

- Resolve public post/comment author labels through `getAuthorLabel`: username, then real name, then "DeetSheet Member"; anonymous posts and comments always show "anonymous".
- Admin screens use `getAdminAuthorLabel` (real name flagged as "(no username)" fallback); public screens use `getAuthorLabel` with the fallback order above.
- Use the shared `PostVisibilityBadge` in admin contribution lists so both public and anonymous posts have explicit visibility labels.
- Combobox keeps its typing and ranked label/word/value filtering in the shared component so all callers retain consistent selection behavior.
- Browser topic URLs and email links share the runtime-neutral slug rules exposed by src/lib/topicSlug; cached topic resolution breaks collisions by approved post count then oldest creation, preserving shared legacy links without changing topic data.
- DM email notifications authorize participants and derive recipients and idempotency from recent persisted member messages server-side; this prevents arbitrary-recipient sends and replay spam.
- DM alerts reuse the admin-message template with the member_messages preference category and honor profiles.email_on_message; template branding must not route member alerts through admin opt-outs.