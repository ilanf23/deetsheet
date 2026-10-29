/** Canonical topic path segment; apostrophes disappear rather than split words. */
export function topicSlug(name: string): string {
  return name.toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function decodeTopicParam(param: string): string {
  try {
    return decodeURIComponent(param);
  } catch {
    return param;
  }
}

/** Preserve the post segment, query and hash verbatim during canonicalization. */
export function canonicalTopicPath(pathname: string, name: string): string {
  return pathname.replace(/^(\/topic\/)[^/]+/, `$1${topicSlug(name)}`);
}

export function resolveTopic<T extends { name: string; postCount: number; createdAt: string; id: string }>(
  topics: readonly T[], param: string,
): T | null {
  const slug = topicSlug(decodeTopicParam(param));
  const matches = topics.filter((topic) => topicSlug(topic.name) === slug);
  matches.sort((a, b) => b.postCount - a.postCount || Date.parse(a.createdAt) - Date.parse(b.createdAt) || a.id.localeCompare(b.id));
  return matches[0] ?? null;
}