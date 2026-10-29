/** Public non-anonymous authors use username, then real name, then a generic member label. */
export function getAuthorLabel(profile?: { username?: string | null; name?: string | null } | null): string {
  return profile?.username?.trim() || profile?.name?.trim() || "DeetSheet Member";
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
