import type { QueryClient } from "@tanstack/react-query";

/**
 * Every cached surface that renders post text. Review actions and post edits
 * write straight to `posts`, so the home page (staleTime 60s) would otherwise
 * keep serving pre-edit rows for up to a minute.
 *
 * Keys are invalidated by PREFIX — React Query matches partially by default —
 * so per-topic and per-limit variants are all covered without enumerating ids.
 * `staleTime` stays untouched: we invalidate precisely instead of refetching
 * on every render.
 */
export const invalidatePostCaches = (
  queryClient: QueryClient,
  postId?: string,
) => {
  [
    ["recent-posts"],
    ["recent-posts-by-topic"],
    ["posts-by-topic"],
    ["post-ranks-for-topics"],
    ["topics"],
    ["topic"],
  ].forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));

  if (postId) queryClient.invalidateQueries({ queryKey: ["post", postId] });
};
