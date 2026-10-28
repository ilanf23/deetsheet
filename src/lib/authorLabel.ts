/** Real names are never a fallback for contribution authors. */
export function getAuthorLabel(profile?: { username?: string | null } | null): string {
  return profile?.username?.trim() || "DeetSheet Member";
}

/**
 * Admin-only label: falls back to the real name (flagged) so admins can
 * identify members who have not set a username. Never use on public surfaces.
 */
export function getAdminAuthorLabel(
  profile?: { username?: string | null; name?: string | null } | null
): string {
  const username = profile?.username?.trim();
  if (username) return username;
  const name = profile?.name?.trim();
  if (name) return `${name} (no username)`;
  return "DeetSheet Member";
}
