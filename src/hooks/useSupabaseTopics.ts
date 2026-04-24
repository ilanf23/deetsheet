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
  imageUrl: string | null;
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
  image_url: string | null;
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
  imageUrl: row.image_url ?? null,
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
        .select("id, slug, name, category_name, description, image_url, posts(count)")
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
        .select("id, slug, name, category_name, description, image_url, posts(count)")
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
            "profiles!posts_author_id_profiles_fkey(username), topics!posts_topic_id_fkey(name, category_name)" as any
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

/**
 * Fetch the most recently added posts for a topic, newest first.
 * Used by the topic-page Recently Added sidebar, which mirrors the
 * homepage sidebar but scoped to the current topic.
 */
export const useRecentPostsByTopic = (topicId: string | undefined, limit = 5) => {
  return useQuery({
    queryKey: ["recent-posts-by-topic", topicId, limit],
    enabled: !!topicId,
    queryFn: async (): Promise<PostRow[]> => {
      if (!topicId) return [];
      const { data, error } = await supabase
        .from("posts")
        .select(
          "id, title, content, topic_id, author_id, score, average_rating, rating_count, comment_count, created_at, " +
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            "profiles!posts_author_id_profiles_fkey(username), topics!posts_topic_id_fkey(name, category_name)" as any
        )
        .eq("topic_id", topicId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data ?? []).map((row: any) => mapPost(row as DbPostRaw));
    },
  });
};

/**
 * Grammatically correct subtitle for a topic page.
 *
 * The source template is "What are the most important details of being a {X}?",
 * which only reads right for count nouns like "Parent" / "Waiter". For locations,
 * time periods, health conditions, and identity adjectives, the article + verb
 * need to change. This helper picks the right form using both per-topic overrides
 * and per-category defaults, falling back to "being a/an {X}" with vowel-sound
 * article selection.
 */
const VOWEL_SOUND = /^[aeiouAEIOU]/;

// Topics that read best as "being in {X}" — "in College", "in Love".
const BEING_IN_TOPICS = new Set<string>(["College", "Love"]);

// Topics that read best with no article — "being Married", "being Gay".
const NO_ARTICLE_TOPICS = new Set<string>([
  "Married",
  "Pregnant",
  "Gay",
  "Obese",
  "Poor",
]);

// Categories where every topic is a place you live in.
const LIVING_IN_CATEGORIES = new Set<string>([
  "Cities",
  "States",
  "Countries",
]);

// Categories where every topic is an institution/group you're "in".
const BEING_IN_CATEGORIES = new Set<string>([
  "Colleges",
  "Schools",
  "Companies",
  "Majors",
  "Clubs",
  "Fanclubs",
  "Teams",
]);

// Health conditions are something you "have", not "are".
const HAVING_CATEGORIES = new Set<string>(["Health"]);

// Health conditions that take an article (countable): "having a Cold".
const COUNTABLE_HEALTH = new Set<string>(["Cold", "Heart Attack"]);

export const getTopicSubtitle = (
  topicName: string,
  categoryName?: string
): string => {
  const prefix = "What are the most important details of";

  if (NO_ARTICLE_TOPICS.has(topicName)) {
    return `${prefix} being ${topicName}?`;
  }

  if (BEING_IN_TOPICS.has(topicName)) {
    return `${prefix} being in ${topicName}?`;
  }

  if (categoryName === "Decades") {
    return `${prefix} living in the ${topicName}?`;
  }

  if (categoryName === "Ages") {
    // Numeric ages ("20s", "30s") use "being in your 20s";
    // word-form ages ("Teens") fall through to default "being a Teen".
    if (/\d/.test(topicName)) {
      return `${prefix} being in your ${topicName}?`;
    }
  }

  if (categoryName && LIVING_IN_CATEGORIES.has(categoryName)) {
    return `${prefix} living in ${topicName}?`;
  }

  if (categoryName && BEING_IN_CATEGORIES.has(categoryName)) {
    return `${prefix} being in ${topicName}?`;
  }

  if (categoryName && HAVING_CATEGORIES.has(categoryName)) {
    if (COUNTABLE_HEALTH.has(topicName)) {
      const article = VOWEL_SOUND.test(topicName) ? "an" : "a";
      return `${prefix} having ${article} ${topicName}?`;
    }
    return `${prefix} having ${topicName}?`;
  }

  const article = VOWEL_SOUND.test(topicName) ? "an" : "a";
  return `${prefix} being ${article} ${topicName}?`;
};
