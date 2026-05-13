import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FollowedUser {
  id: string;
  username: string | null;
  name: string | null;
  avatarUrl: string | null;
  followedAt: string;
}

export interface FollowedTopic {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  followedAt: string;
}

export interface FollowedPost {
  id: string;
  title: string;
  content: string;
  topicId: string;
  topicName: string;
  rank: number;
  authorId: string;
  authorUsername: string | null;
  averageRating: number;
  ratingCount: number;
  commentCount: number;
  followedAt: string;
}

interface FollowingPayload {
  users: FollowedUser[];
  topics: FollowedTopic[];
  posts: FollowedPost[];
  total: number;
}

const fetchProfilesByIds = async (
  ids: string[]
): Promise<Map<string, { username: string | null; name: string | null; avatarUrl: string | null }>> => {
  const map = new Map<string, { username: string | null; name: string | null; avatarUrl: string | null }>();
  if (ids.length === 0) return map;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, name, avatar_url")
    .in("id", ids);
  if (error) throw error;
  for (const row of (data ?? []) as Array<{
    id: string;
    username: string | null;
    name: string | null;
    avatar_url: string | null;
  }>) {
    map.set(row.id, {
      username: row.username,
      name: row.name,
      avatarUrl: row.avatar_url,
    });
  }
  return map;
};

/**
 * Fetch every entity a user follows: other users, topics, and posts.
 * Posts include their per-topic rank so links can deep-link to
 * `/topic/:topicName/post/:rank` (the PostPage route).
 *
 * Pass `enabled: false` to defer the (heavy) fetch until it's actually needed
 * — e.g. only when the user opens the "Following" tab.
 */
export const useFollowing = (userId: string | undefined, options?: { enabled?: boolean }) => {
  const enabled = options?.enabled ?? true;
  return useQuery({
    queryKey: ["following", userId],
    enabled: !!userId && enabled,
    queryFn: async (): Promise<FollowingPayload> => {
      if (!userId) return { users: [], topics: [], posts: [], total: 0 };

      const [userFollowsRes, topicFollowsRes, postFollowsRes] = await Promise.all([
        supabase
          .from("user_follows" as never)
          .select("following_id, created_at")
          .eq("follower_id", userId)
          .order("created_at", { ascending: false }),
        supabase
          .from("topic_follows" as never)
          .select(
            "topic_id, created_at, topics!topic_follows_topic_id_fkey(id, name, slug, description)"
          )
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
        supabase
          .from("post_follows" as never)
          .select(
            "post_id, created_at, posts!post_follows_post_id_fkey(id, title, content, topic_id, author_id, average_rating, rating_count, comment_count, topics!posts_topic_id_fkey(id, name), profiles!posts_author_id_profiles_fkey(username))"
          )
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
      ]);

      if (userFollowsRes.error) throw userFollowsRes.error;
      if (topicFollowsRes.error) throw topicFollowsRes.error;
      if (postFollowsRes.error) throw postFollowsRes.error;

      // Followed users: two-step (user_follows references auth.users, not profiles)
      const userRows = (userFollowsRes.data ?? []) as Array<{
        following_id: string;
        created_at: string;
      }>;
      const profileMap = await fetchProfilesByIds(userRows.map((r) => r.following_id));
      const users: FollowedUser[] = userRows
        .map((row) => {
          const p = profileMap.get(row.following_id);
          if (!p) return null;
          return {
            id: row.following_id,
            username: p.username,
            name: p.name,
            avatarUrl: p.avatarUrl,
            followedAt: row.created_at,
          };
        })
        .filter((x): x is FollowedUser => x !== null);

      const topics: FollowedTopic[] = ((topicFollowsRes.data ?? []) as Array<Record<string, unknown>>)
        .map((row) => {
          const t = row.topics as Record<string, unknown> | null;
          if (!t) return null;
          return {
            id: t.id as string,
            name: t.name as string,
            slug: (t.slug as string) ?? null,
            description: (t.description as string) ?? null,
            followedAt: row.created_at as string,
          };
        })
        .filter((x): x is FollowedTopic => x !== null);

      const rawPosts = ((postFollowsRes.data ?? []) as Array<Record<string, unknown>>)
        .map((row) => {
          const p = row.posts as Record<string, unknown> | null;
          if (!p) return null;
          const t = p.topics as Record<string, unknown> | null;
          const author = p.profiles as Record<string, unknown> | null;
          return {
            id: p.id as string,
            title: p.title as string,
            content: p.content as string,
            topicId: p.topic_id as string,
            topicName: (t?.name as string) ?? "",
            authorId: p.author_id as string,
            authorUsername: (author?.username as string) ?? null,
            averageRating: Number(p.average_rating ?? 0),
            ratingCount: Number(p.rating_count ?? 0),
            commentCount: Number(p.comment_count ?? 0),
            followedAt: row.created_at as string,
          };
        })
        .filter((x): x is Omit<FollowedPost, "rank"> => x !== null);

      // Compute per-topic ranks (matches usePostsByTopic ordering: avg desc, count desc)
      const topicIds = Array.from(new Set(rawPosts.map((p) => p.topicId)));
      const ranks = new Map<string, number>();
      if (topicIds.length > 0) {
        const { data: peers, error: peersErr } = await supabase
          .from("posts")
          .select("id, topic_id, average_rating, rating_count")
          .in("topic_id", topicIds);
        if (peersErr) throw peersErr;

        const byTopic = new Map<string, Array<{ id: string; avg: number; count: number }>>();
        for (const row of (peers ?? []) as Array<{
          id: string;
          topic_id: string;
          average_rating: number | null;
          rating_count: number | null;
        }>) {
          const arr = byTopic.get(row.topic_id) ?? [];
          arr.push({
            id: row.id,
            avg: Number(row.average_rating ?? 0),
            count: row.rating_count ?? 0,
          });
          byTopic.set(row.topic_id, arr);
        }
        for (const arr of byTopic.values()) {
          arr.sort((a, b) => (b.avg !== a.avg ? b.avg - a.avg : b.count - a.count));
          arr.forEach((row, i) => ranks.set(row.id, i + 1));
        }
      }

      const posts: FollowedPost[] = rawPosts.map((p) => ({
        ...p,
        rank: ranks.get(p.id) ?? 1,
      }));

      return {
        users,
        topics,
        posts,
        total: users.length + topics.length + posts.length,
      };
    },
  });
};

/**
 * Fetch users who follow this profile (the followers list). Pass
 * `enabled: false` to defer the fetch until the user opens the tab.
 */
export const useFollowers = (
  userId: string | undefined,
  options?: { enabled?: boolean },
) => {
  const enabled = options?.enabled ?? true;
  return useQuery({
    queryKey: ["followers", userId],
    enabled: !!userId && enabled,
    queryFn: async (): Promise<FollowedUser[]> => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("user_follows" as never)
        .select("follower_id, created_at")
        .eq("following_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const rows = (data ?? []) as Array<{ follower_id: string; created_at: string }>;
      const profileMap = await fetchProfilesByIds(rows.map((r) => r.follower_id));

      return rows
        .map((row) => {
          const p = profileMap.get(row.follower_id);
          if (!p) return null;
          return {
            id: row.follower_id,
            username: p.username,
            name: p.name,
            avatarUrl: p.avatarUrl,
            followedAt: row.created_at,
          };
        })
        .filter((x): x is FollowedUser => x !== null);
    },
  });
};
