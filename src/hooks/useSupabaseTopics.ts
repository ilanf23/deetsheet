import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { buildPostImageUrl } from "@/lib/topicImageQueries";

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
  subtitleOverride: string | null;
}

/** Shape the UI expects for a post row (maps to legacy seedData.Post,
 * keeping field names stable for child components that already destructure
 * `post.title`, `post.content`, `post.ratingScore`, etc.). */
export interface PostRow {
  id: string;
  title: string;
  content: string;
  story: string | null;
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
  imageUrl: string | null;
  avatarUrl: string | null;
  status: "pending" | "approved" | "rejected";
  isAnonymous: boolean;
}

type DbTopicRaw = {
  id: string;
  slug: string;
  name: string;
  category_name: string | null;
  description: string | null;
  image_url: string | null;
  subtitle_override?: string | null;
};

type DbPostRaw = {
  id: string;
  title: string;
  content?: string;
  story?: string | null;
  topic_id: string;
  author_id: string;
  score?: number;
  average_rating: number | null;
  rating_count: number | null;
  comment_count: number | null;
  created_at: string;
  image_url?: string | null;
  status?: string | null;
  is_anonymous?: boolean | null;
  profiles?: { username: string | null; avatar_url: string | null } | null;
  topics?: { name: string; category_name: string | null; image_url: string | null; subtitle_override?: string | null } | null;
};

const mapTopic = (row: DbTopicRaw, postCount: number): TopicRow => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  categoryName: row.category_name ?? "Life",
  postCount,
  description: row.description,
  imageUrl: row.image_url ?? null,
  subtitleOverride: row.subtitle_override ?? null,
});

const mapPost = (row: DbPostRaw): PostRow => {
  const rawStatus = row.status ?? "approved";
  const status: PostRow["status"] =
    rawStatus === "pending" || rawStatus === "rejected" ? rawStatus : "approved";
  return {
    id: row.id,
    title: row.title,
    content: row.content ?? "",
    story: row.story ?? null,
    topicId: row.topic_id,
    topicName: row.topics?.name ?? "",
    categoryName: row.topics?.category_name ?? "Life",
    authorId: row.author_id,
    username: row.profiles?.username ?? "anonymous",
    ratingScore: Number(row.average_rating ?? 0),
    ratingCount: row.rating_count ?? 0,
    commentCount: row.comment_count ?? 0,
    score: row.score ?? 0,
    createdAt: new Date(row.created_at),
    imageUrl: row.image_url ?? null,
    avatarUrl: row.profiles?.avatar_url ?? null,
    status,
    isAnonymous: !!row.is_anonymous,
  };
};

/**
 * Fetch every topic plus a derived post count. Uses a single round trip
 * (`select('*, posts(count)')`) instead of N+1 queries.
 */
export const useTopics = () => {
  return useQuery({
    queryKey: ["topics"],
    queryFn: async (): Promise<TopicRow[]> => {
      const { data, error } = await supabase
        .from("topics")
        .select("id, slug, name, category_name, description, image_url, subtitle_override, posts(count)")
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
        .from("topics")
        .select("id, slug, name, category_name, description, image_url, subtitle_override, posts(count)")
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
 * Compare two posts for ranked ordering within a topic:
 *   1. Rated posts (rating_count > 0) come before unrated posts.
 *   2. Higher average_rating first.
 *   3. Higher rating_count first.
 *   4. Older created_at first as the final tie-breaker (stable history).
 */
const compareRankedPosts = (
  a: { ratingScore: number; ratingCount: number; createdAt: Date },
  b: { ratingScore: number; ratingCount: number; createdAt: Date }
): number => {
  const aRated = a.ratingCount > 0 ? 1 : 0;
  const bRated = b.ratingCount > 0 ? 1 : 0;
  if (aRated !== bRated) return bRated - aRated;
  if (b.ratingScore !== a.ratingScore) return b.ratingScore - a.ratingScore;
  if (b.ratingCount !== a.ratingCount) return b.ratingCount - a.ratingCount;
  return a.createdAt.getTime() - b.createdAt.getTime();
};

/**
 * Fetch approved posts for a topic by topic id. Pending/rejected posts are
 * excluded from the main ranked list — they remain accessible through user
 * and admin review surfaces. Sorted deterministically: rated posts first,
 * then by average_rating desc, rating_count desc, with older created_at as
 * the final tie-breaker.
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
          "id, title, content, story, topic_id, author_id, score, average_rating, rating_count, comment_count, created_at, image_url, status, is_anonymous, " +
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            "profiles!posts_author_id_profiles_fkey(username, avatar_url), topics!posts_topic_id_fkey(name, category_name, image_url)" as any
        )
        .eq("topic_id", topicId)
        .eq("status", "approved");

      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped = (data ?? []).map((row: any) => mapPost(row as DbPostRaw));
      mapped.sort(compareRankedPosts);
      return mapped;
    },
  });
};

/**
 * Fetch the most recently added posts across every topic, newest first.
 * Server-side `LIMIT` returns exactly the rows we render — no over-fetch
 * or client-side shuffle.
 */
export const useRecentPosts = (limit = 8) => {
  return useQuery({
    queryKey: ["recent-posts", limit],
    staleTime: 60_000,
    queryFn: async (): Promise<PostRow[]> => {
      // Fetch a wider window so we can dedupe by topic and surface variety
      // (seed data often shares timestamps within a single topic).
      const { data, error } = await supabase
        .from("posts")
        .select(
          "id, title, topic_id, author_id, average_rating, rating_count, comment_count, created_at, image_url, status, is_anonymous, " +
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            "profiles!posts_author_id_profiles_fkey(username, avatar_url), topics!posts_topic_id_fkey(name, category_name, image_url)" as any
        )
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(Math.max(limit * 10, 100));

      if (error) throw error;

      // Keep only the newest post per topic, preserving created_at order.
      const seen = new Set<string>();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const unique: any[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const row of (data ?? []) as any[]) {
        if (seen.has(row.topic_id)) continue;
        seen.add(row.topic_id);
        unique.push(row);
        if (unique.length >= limit) break;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return unique.map((row: any) => mapPost(row as DbPostRaw));
    },
  });
};

/**
 * Resolve each post's 1-based rank within its own topic (rating-sorted,
 * matching `usePostsByTopic`'s ordering: average_rating desc, rating_count
 * desc). Used by surfaces that link to /topic/:topicName/post/:rank from
 * lists that aren't sorted by rank — e.g. the homepage Recent Posts sidebar.
 *
 * One batched query per unique topic_id set, sorted client-side per topic.
 */
export const usePostRanksForTopics = (topicIds: string[]) => {
  const sortedKey = [...topicIds].sort().join(",");
  return useQuery({
    queryKey: ["post-ranks-for-topics", sortedKey],
    enabled: topicIds.length > 0,
    staleTime: 60_000,
    queryFn: async (): Promise<Map<string, number>> => {
      const { data, error } = await supabase
        .from("posts")
        .select("id, topic_id, average_rating, rating_count, created_at")
        .eq("status", "approved")
        .in("topic_id", topicIds);

      if (error) throw error;

      const byTopic = new Map<
        string,
        Array<{ id: string; ratingScore: number; ratingCount: number; createdAt: Date }>
      >();
      for (const row of (data ?? []) as Array<{
        id: string;
        topic_id: string;
        average_rating: number | null;
        rating_count: number | null;
        created_at: string;
      }>) {
        const arr = byTopic.get(row.topic_id) ?? [];
        arr.push({
          id: row.id,
          ratingScore: Number(row.average_rating ?? 0),
          ratingCount: row.rating_count ?? 0,
          createdAt: new Date(row.created_at),
        });
        byTopic.set(row.topic_id, arr);
      }

      const ranks = new Map<string, number>();
      for (const arr of byTopic.values()) {
        arr.sort(compareRankedPosts);
        arr.forEach((row, i) => ranks.set(row.id, i + 1));
      }
      return ranks;
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
          "id, title, content, story, topic_id, author_id, score, average_rating, rating_count, comment_count, created_at, image_url, status, is_anonymous, " +
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            "profiles!posts_author_id_profiles_fkey(username, avatar_url), topics!posts_topic_id_fkey(name, category_name, image_url)" as any
        )
        .eq("topic_id", topicId)
        .eq("status", "approved")
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
  categoryName?: string,
  subtitleOverride?: string | null,
): string => {
  if (subtitleOverride && subtitleOverride.trim().length > 0) {
    return subtitleOverride.trim();
  }
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
