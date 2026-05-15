export function slugifyPostTitle(input: string | null | undefined): string {
  if (!input) return "";
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const SHORT_ID_LEN = 8;
const SHORT_ID_RE = /^[0-9a-f]{8}$/i;

export function buildPostSlug(
  title: string | null | undefined,
  postId: string | null | undefined,
): string {
  const titleSlug = slugifyPostTitle(title);
  const shortId = postId ? postId.slice(0, SHORT_ID_LEN).toLowerCase() : "";
  if (titleSlug && shortId) return `${titleSlug}-${shortId}`;
  return titleSlug || shortId || "";
}

export function parsePostSlug(
  slug: string | null | undefined,
): { titleSlug: string; shortId: string | null } {
  if (!slug) return { titleSlug: "", shortId: null };
  const m = slug.match(/^(.*?)-?([0-9a-f]{8})$/i);
  if (m && SHORT_ID_RE.test(m[2])) {
    return { titleSlug: m[1] ?? "", shortId: m[2].toLowerCase() };
  }
  return { titleSlug: slug, shortId: null };
}
