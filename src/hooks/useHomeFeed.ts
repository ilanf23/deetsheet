import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "@/contexts/LocationContext";

/**
 * Cascading homepage feed (topic-driven):
 *
 *   1. Topics with posts in the visitor's CITY    → "Near you in {City}"
 *   2. Fill from the same STATE                   → "More from {State}"
 *   3. Fill with national/trending                → "Trending nationally"
 *
 * For each tier we pick up to TOPICS_PER_TIER topics, and for each topic we
 * fetch its top POSTS_PER_TOPIC posts so the cards always look full (matches
 * the "≥5 posts per box" product requirement).
 */

const TARGET_TOPICS = 8;        // total topic cards to render across all tiers
const POSTS_PER_TOPIC = 5;      // posts shown inside each topic card

export interface FeedPost {
  id: string;
  title: string;
  content: string;
  topicId: string;
  topicName: string;
  averageRating: number;
  ratingCount: number;
  commentCount: number;
  createdAt: string;
  locationId: string | null;
  isNational: boolean;
  city: string | null;
  state: string | null;
}

export interface FeedSection {
  key: "city" | "state" | "national";
  label: string | null;
  posts: FeedPost[];
}

const POST_SELECT =
  "id, title, content, topic_id, average_rating, rating_count, comment_count, created_at, location_id, is_national, " +
  "topics!posts_topic_id_fkey(name), locations!posts_location_id_fkey(city, state)";

interface RawPostRow {
  id: string;
  title: string;
  content: string;
  topic_id: string;
  average_rating: number | null;
  rating_count: number | null;
  comment_count: number | null;
  created_at: string;
  location_id: string | null;
  is_national: boolean;
  topics?: { name: string } | null;
  locations?: { city: string; state: string } | null;
}

const mapPost = (row: RawPostRow): FeedPost => ({
  id: row.id,
  title: row.title,
  content: row.content,
  topicId: row.topic_id,
  topicName: row.topics?.name ?? "",
  averageRating: Number(row.average_rating ?? 0),
  ratingCount: row.rating_count ?? 0,
  commentCount: row.comment_count ?? 0,
  createdAt: row.created_at,
  locationId: row.location_id,
  isNational: row.is_national,
  city: row.locations?.city ?? null,
  state: row.locations?.state ?? null,
});

/**
 * Pick distinct topic_ids (in order) from a list of posts, skipping any
 * topic_ids we've already used in earlier tiers.
 */
const pickTopicIds = (rows: RawPostRow[], used: Set<string>, limit: number): string[] => {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const r of rows) {
    if (used.has(r.topic_id) || seen.has(r.topic_id)) continue;
    seen.add(r.topic_id);
    out.push(r.topic_id);
    if (out.length >= limit) break;
  }
  return out;
};

/**
 * For a set of topic_ids, fetch the top POSTS_PER_TOPIC posts per topic
 * (highest avg rating). We do one query per topic so each card is filled.
 */
const fetchPostsForTopics = async (topicIds: string[]): Promise<Map<string, FeedPost[]>> => {
  const result = new Map<string, FeedPost[]>();
  await Promise.all(
    topicIds.map(async (tid) => {
      const { data } = await supabase
        .from("posts")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .select(POST_SELECT as any)
        .eq("topic_id", tid)
        .order("average_rating", { ascending: false, nullsFirst: false })
        .order("rating_count", { ascending: false })
        .limit(POSTS_PER_TOPIC);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const posts = ((data as any[]) ?? []).map((r) => mapPost(r as RawPostRow));
      result.set(tid, posts);
    })
  );
  return result;
};

export const useHomeFeed = () => {
  const { location } = useLocation();
  const city = location?.city ?? null;
  const state = location?.state ?? null;

  return useQuery({
    queryKey: ["home-feed", city, state],
    queryFn: async (): Promise<FeedSection[]> => {
      const sections: FeedSection[] = [];
      const usedTopicIds = new Set<string>();
      let remainingTopics = TARGET_TOPICS;

      // ---- Tier 1: city ----
      if (city && state && remainingTopics > 0) {
        const { data: locRows } = await supabase
          .from("locations")
          .select("id")
          .ilike("city", city)
          .eq("state", state)
          .limit(50);
        const locIds = (locRows ?? []).map((l) => l.id);

        if (locIds.length > 0) {
          const { data } = await supabase
            .from("posts")
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .select("id, topic_id, average_rating, rating_count" as any)
            .in("location_id", locIds)
            .order("average_rating", { ascending: false, nullsFirst: false })
            .order("rating_count", { ascending: false })
            .limit(200);

          const topicIds = pickTopicIds(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (data as any[]) ?? [],
            usedTopicIds,
            remainingTopics
          );
          if (topicIds.length > 0) {
            const map = await fetchPostsForTopics(topicIds);
            const posts: FeedPost[] = topicIds.flatMap((tid) => map.get(tid) ?? []);
            topicIds.forEach((tid) => usedTopicIds.add(tid));
            sections.push({ key: "city", label: `Near you in ${city}`, posts });
            remainingTopics -= topicIds.length;
          }
        }
      }

      // ---- Tier 2: state ----
      if (state && remainingTopics > 0) {
        const { data: locRows } = await supabase
          .from("locations")
          .select("id")
          .eq("state", state);
        const locIds = (locRows ?? []).map((l) => l.id);

        if (locIds.length > 0) {
          const { data } = await supabase
            .from("posts")
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .select("id, topic_id, average_rating, rating_count" as any)
            .in("location_id", locIds)
            .order("average_rating", { ascending: false, nullsFirst: false })
            .order("rating_count", { ascending: false })
            .limit(200);

          const topicIds = pickTopicIds(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (data as any[]) ?? [],
            usedTopicIds,
            remainingTopics
          );
          if (topicIds.length > 0) {
            const map = await fetchPostsForTopics(topicIds);
            const posts: FeedPost[] = topicIds.flatMap((tid) => map.get(tid) ?? []);
            topicIds.forEach((tid) => usedTopicIds.add(tid));
            sections.push({ key: "state", label: `More from ${state}`, posts });
            remainingTopics -= topicIds.length;
          }
        }
      }

      // ---- Tier 3: national / trending fallback ----
      if (remainingTopics > 0) {
        const { data } = await supabase
          .from("posts")
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .select("id, topic_id, average_rating, rating_count" as any)
          .order("average_rating", { ascending: false, nullsFirst: false })
          .order("rating_count", { ascending: false })
          .limit(500);

        const topicIds = pickTopicIds(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (data as any[]) ?? [],
          usedTopicIds,
          remainingTopics
        );
        if (topicIds.length > 0) {
          const map = await fetchPostsForTopics(topicIds);
          const posts: FeedPost[] = topicIds.flatMap((tid) => map.get(tid) ?? []);
          // Only label this tier when the visitor has a location and we've
          // already shown a city/state tier above.
          const label = sections.length > 0 ? "Trending nationally" : null;
          sections.push({ key: "national", label, posts });
        }
      }

      return sections;
    },
    staleTime: 30_000,
  });
};
