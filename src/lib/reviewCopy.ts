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
