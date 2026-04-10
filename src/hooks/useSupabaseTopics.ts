import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Data hooks that replace the hardcoded seedData.ts imports on
 * TopicsDirectory and TopicPage. The DB is seeded with the same
 * fake content via migration 20260410120500_seed_topics_and_posts.sql,
 * so the user-visible data stays consistent while interactions
 * (votes, comments, ratings) now persist against real rows.
 *
 * NOTE: The generated Supabase types in src/integrations/supabase/types.ts
 * are stale — they don't reflect the `category_name` column on `topics`
 * (added in migration 20260312000000_user_topic_creation.sql) or the
 * denormalized counts on `topics`/`posts`. We cast to the shapes below
 * to keep the refactored UI type-safe. Regenerate the types on the next
 * Supabase CLI pass to drop these casts.
 */

/** Shape the UI expects for a topic row (matches the legacy seedData.Topic
 * closely enough that TopicsDirectory / TopicPage don't need rewrites). */
export interface TopicRow {
  id: string;
  slug: string;
  name: string;
  categoryName: string;
  postCount: number;
  description: string | null;
}

/** Shape the UI expects for a post row (maps to legacy seedData.Post,
 * keeping field names stable for child components that already destructure
 * `post.title`, `post.content`, `post.ratingScore`, etc.). */
export interface PostRow {
  id: string;
  title: string;
  content: string;
  topicId: string;
  topicName: string;
  categoryName: string;
  authorId: string;
  username: string;
  ratingScore: number;
  ratingCount: number;
  commentCount: number;
  score: number;
  createdAt: Date;
}

type DbTopicRaw = {
  id: string;
  slug: string;
  name: string;
  category_name: string | null;
  description: string | null;
};

type DbPostRaw = {
  id: string;
  title: string;
  content: string;
  topic_id: string;
  author_id: string;
  score: number;
  average_rating: number | null;
  rating_count: number | null;
  comment_count: number | null;
  created_at: string;
  profiles?: { username: string | null } | null;
  topics?: { name: string; category_name: string | null } | null;
};

const mapTopic = (row: DbTopicRaw, postCount: number): TopicRow => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  categoryName: row.category_name ?? "Life",
  postCount,
  description: row.description,
});

const mapPost = (row: DbPostRaw): PostRow => ({
  id: row.id,
  title: row.title,
  content: row.content,
  topicId: row.topic_id,
  topicName: row.topics?.name ?? "",
  categoryName: row.topics?.category_name ?? "Life",
  authorId: row.author_id,
  username: row.profiles?.username ?? "anonymous",
  ratingScore: Number(row.average_rating ?? 0),
  ratingCount: row.rating_count ?? 0,
  commentCount: row.comment_count ?? 0,
  score: row.score,
  createdAt: new Date(row.created_at),
});

/**
 * Fetch every topic plus a derived post count. Uses a single round trip
 * (`select('*, posts(count)')`) instead of N+1 queries.
 */
export const useTopics = () => {
  return useQuery({
    queryKey: ["topics"],
    queryFn: async (): Promise<TopicRow[]> => {
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from("topics" as any)
        .select("id, slug, name, category_name, description, posts(count)")
        .order("name", { ascending: true });

      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data ?? []).map((row: any) =>
        mapTopic(row as DbTopicRaw, row.posts?.[0]?.count ?? 0)
      );
    },
    staleTime: 60_000,
  });
};

/**
 * Fetch a single topic by its display name (matches the legacy
 * getTopicByName helper's URL-param-driven lookup). The seed migration
 * uses slugified names, so we match on either `name` or `slug`.
 */
export const useTopicByName = (topicName: string | undefined) => {
  return useQuery({
    queryKey: ["topic", topicName],
    enabled: !!topicName,
    queryFn: async (): Promise<TopicRow | null> => {
      if (!topicName) return null;
      const decoded = decodeURIComponent(topicName);
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from("topics" as any)
        .select("id, slug, name, category_name, description, posts(count)")
        .or(`name.eq.${decoded},slug.eq.${decoded.toLowerCase()}`)
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const row = data as any;
      return mapTopic(row as DbTopicRaw, row.posts?.[0]?.count ?? 0);
    },
  });
};

/**
 * Fetch posts for a topic by topic id. Joins profiles for username
 * and topics for the topic/category name so mapPost has everything it
 * needs without extra round trips. Sorted by average rating desc, then
 * rating count — matches the legacy getPostsByTopic ordering.
 */
export const usePostsByTopic = (topicId: string | undefined) => {
  return useQuery({
    queryKey: ["posts-by-topic", topicId],
    enabled: !!topicId,
    queryFn: async (): Promise<PostRow[]> => {
      if (!topicId) return [];
      const { data, error } = await supabase
        .from("posts")
        .select(
          "id, title, content, topic_id, author_id, score, average_rating, rating_count, comment_count, created_at, " +
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            "profiles(username), topics(name, category_name)" as any
        )
        .eq("topic_id", topicId)
        .order("average_rating", { ascending: false, nullsFirst: false })
        .order("rating_count", { ascending: false });

      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data ?? []).map((row: any) => mapPost(row as DbPostRaw));
    },
  });
};

/** Static subtitle for a topic page — pure function, kept here so the
 * TopicPage refactor doesn't need to import from seedData for one string. */
export const getTopicSubtitle = (topicName: string): string =>
  `What are the most important details of being a ${topicName}?`;
