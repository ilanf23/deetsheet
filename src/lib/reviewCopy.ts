/**
 * CANONICAL REVIEW COPY (browser / admin side).
 *
 * These strings are client-approved. Any change here MUST be mirrored in
 * `supabase/functions/_shared/transactional-email-templates/copy.ts`, which
 * holds the identical constants for the email templates. A true shared import
 * is impossible: the edge copy is loaded by Deno inside `supabase/functions/`,
 * which cannot reach into `src/`, and the Vite app cannot import Deno `npm:`
 * modules.
 */

/** Closing paragraph of the "suggest changes" / pending email + admin default body. */
export const PENDING_CLOSING =
  "If you would like to change your post using the suggestions above, you may do so by clicking the green box below or go to your DeetSheet inbox to edit your pending post. Once you've updated your post, it will go back into review.";

/** 30-day auto-delete warning shown in the email's DeadlineStrip. */
export const PENDING_DEADLINE =
  "You will have 30 days to adjust your post, or it will be automatically deleted.";

/** Short form of the deadline used as the default in admin form letters. */
export const PENDING_DEADLINE_SHORT =
  "30 days to adjust, or the post is automatically deleted";

/** Public origin used when a relative link has to be made absolute for email. */
export const SITE_ORIGIN = "https://deetsheet.com";

const EDIT_PHRASE = "edit your pending post";

/**
 * The pending closing paragraph with the existing "edit your pending post"
 * phrase turned into a markdown link to that post's edit surface. Falls back to
 * the plain copy when no post id is available.
 */
export function pendingClosingWithEditLink(postId?: string | null): string {
  if (!postId) return PENDING_CLOSING;
  return PENDING_CLOSING.replace(EDIT_PHRASE, `[${EDIT_PHRASE}](/profile?edit=${postId})`);
}

/**
 * Rewrite site-relative markdown link targets to absolute URLs. Emails must
 * never contain a relative href.
 */
export function absolutizeMarkdownLinks(text: string, origin: string = SITE_ORIGIN): string {
  return (text ?? "").replace(/\]\((\/(?!\/)[^)\s]*)\)/g, (_m, path) => `](${origin}${path})`);
}
