# Project conventions

- Resolve post/comment author labels through `getAuthorLabel` so real names never become fallback contribution identities.
- Admin screens use `getAdminAuthorLabel` (real name flagged as "(no username)" fallback); public screens use `getAuthorLabel` (never real names).
- Use the shared `PostVisibilityBadge` in admin contribution lists so both public and anonymous posts have explicit visibility labels.