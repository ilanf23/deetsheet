/** Real names are never a fallback for contribution authors. */
export function getAuthorLabel(profile?: { username?: string | null } | null): string {
  return profile?.username?.trim() || "DeetSheet Member";
}