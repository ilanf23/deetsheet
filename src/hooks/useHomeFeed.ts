import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "@/contexts/LocationContext";

/**
 * Cascading homepage feed:
 *
 *   1. Posts authored in the visitor's CITY    → "Near you in {City}"
 *   2. If <20 total, fill from the same STATE  → "More from {State}"
 *   3. If still <20, fill with national/trending → "Trending nationally"
 *
 * For visitors without a location, we skip straight to step 3 with no labels.
 *
 * NOTE: The "national" tier uses the highest-rated posts overall as a stand-in
 * for trending, so visitors with no location-targeted content still see a full
 * feed. Existing posts (with no location_id and is_national = false) are
 * included in this tier so they remain visible.
 */

const TARGET_COUNT = 20;

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

export const useHomeFeed = () => {
  const { location } = useLocation();
  const city = location?.city ?? null;
  const state = location?.state ?? null;

  return useQuery({
    queryKey: ["home-feed", city, state],
    queryFn: async (): Promise<FeedSection[]> => {
      const sections: FeedSection[] = [];
      const seen = new Set<string>();
      let remaining = TARGET_COUNT;

      // ---- Tier 1: city ----
      if (city && state && remaining > 0) {
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
            .select(POST_SELECT as any)
            .in("location_id", locIds)
            .order("average_rating", { ascending: false, nullsFirst: false })
            .order("rating_count", { ascending: false })
            .limit(remaining);

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const posts = ((data as any[]) ?? []).map((r) => mapPost(r as RawPostRow));
          posts.forEach((p) => seen.add(p.id));
          if (posts.length > 0) {
            sections.push({ key: "city", label: `Near you in ${city}`, posts });
            remaining -= posts.length;
          }
        }
      }

      // ---- Tier 2: state ----
      if (state && remaining > 0) {
        const { data: locRows } = await supabase
          .from("locations")
          .select("id")
          .eq("state", state);
        const locIds = (locRows ?? []).map((l) => l.id);

        if (locIds.length > 0) {
          const { data } = await supabase
            .from("posts")
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .select(POST_SELECT as any)
            .in("location_id", locIds)
            .order("average_rating", { ascending: false, nullsFirst: false })
            .order("rating_count", { ascending: false })
            .limit(remaining + seen.size);

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const posts = ((data as any[]) ?? [])
            .map((r) => mapPost(r as RawPostRow))
            .filter((p) => !seen.has(p.id))
            .slice(0, remaining);
          posts.forEach((p) => seen.add(p.id));
          if (posts.length > 0) {
            sections.push({ key: "state", label: `More from ${state}`, posts });
            remaining -= posts.length;
          }
        }
      }

      // ---- Tier 3: national / trending fallback ----
      if (remaining > 0) {
        const { data } = await supabase
          .from("posts")
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .select(POST_SELECT as any)
          .order("average_rating", { ascending: false, nullsFirst: false })
          .order("rating_count", { ascending: false })
          .limit(remaining + seen.size);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const posts = ((data as any[]) ?? [])
          .map((r) => mapPost(r as RawPostRow))
          .filter((p) => !seen.has(p.id))
          .slice(0, remaining);

        if (posts.length > 0) {
          // Only label this tier when the visitor actually has a location and
          // we've already shown city/state results — otherwise the bare feed
          // shouldn't shout "Trending nationally".
          const label = sections.length > 0 ? "Trending nationally" : null;
          sections.push({ key: "national", label, posts });
        }
      }

      return sections;
    },
    staleTime: 30_000,
  });
};
