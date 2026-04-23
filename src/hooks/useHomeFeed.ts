import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "@/contexts/LocationContext";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Personalized homepage feed.
 *
 * Signed in:
 *   1. Profile signals (state, college, major, job, age, hobbies)
 *   2. If sparse, fall through to city/state/national cascade
 *   3. Always tail with a "Trending nationally" card if the column is thin
 *
 * Signed out:
 *   1. City → State → National cascade (driven by localStorage location)
 */

const TARGET_TOPICS = 8;
const POSTS_PER_TOPIC = 5;
const MIN_PERSONALIZED_BEFORE_TAIL = 4;

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
  key: "profile" | "city" | "state" | "national";
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

// US state name lookup (abbreviation → full name) since profiles store either form
// and topics in the "States" category use full names.
const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri",
  MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio",
  OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
};

const expandState = (s: string | null): string | null => {
  if (!s) return null;
  const trimmed = s.trim();
  if (trimmed.length === 2) return STATE_NAMES[trimmed.toUpperCase()] ?? trimmed;
  return trimmed;
};

const ageBucket = (birthYear: string | null): string | null => {
  if (!birthYear) return null;
  const yr = parseInt(birthYear, 10);
  if (!yr || isNaN(yr)) return null;
  const age = new Date().getFullYear() - yr;
  if (age < 10 || age > 120) return null;
  const decade = Math.floor(age / 10) * 10;
  return `${decade}s`;
};

interface ProfileRow {
  city: string | null;
  state: string | null;
  college: string | null;
  major: string | null;
  job: string | null;
  birth_year: string | null;
  entity_type: string | null;
}

interface SignalLookup {
  category: string;
  // Either an exact name match or a fuzzy ilike pattern
  exact?: string;
  fuzzy?: string;
  buildLabel: (matchedName: string) => string;
}

const buildSignals = (p: ProfileRow): SignalLookup[] => {
  const signals: SignalLookup[] = [];
  const stateName = expandState(p.state);
  if (stateName) {
    signals.push({
      category: "States",
      exact: stateName,
      buildLabel: (name) => `Because you're in ${name}`,
    });
  }
  if (p.city) {
    signals.push({
      category: "Cities",
      exact: p.city.trim(),
      buildLabel: (name) => `Near you in ${name}`,
    });
  }
  if (p.college) {
    signals.push({
      category: "Colleges",
      fuzzy: p.college.trim(),
      buildLabel: (name) => `From your alma mater: ${name}`,
    });
  }
  if (p.major) {
    signals.push({
      category: "Majors",
      fuzzy: p.major.trim(),
      buildLabel: (name) => `For your major: ${name}`,
    });
  }
  if (p.job) {
    signals.push({
      category: "Jobs",
      fuzzy: p.job.trim(),
      buildLabel: (name) => `For ${name}s like you`,
    });
  }
  const age = ageBucket(p.birth_year);
  if (age) {
    signals.push({
      category: "Ages",
      exact: age,
      buildLabel: (name) => `In your ${name}`,
    });
  }
  if (p.entity_type) {
    signals.push({
      category: "Hobbies",
      fuzzy: p.entity_type.trim(),
      buildLabel: (name) => `Your interest: ${name}`,
    });
  }
  return signals;
};

interface MatchedTopic {
  id: string;
  name: string;
  label: string;
}

const matchTopicForSignal = async (sig: SignalLookup): Promise<MatchedTopic | null> => {
  let q = supabase.from("topics").select("id, name").eq("category_name", sig.category);
  if (sig.exact) {
    q = q.ilike("name", sig.exact);
  } else if (sig.fuzzy) {
    // contains match (either direction handled by single ilike with %term%)
    q = q.ilike("name", `%${sig.fuzzy}%`);
  }
  const { data } = await q.limit(1);
  const row = data?.[0];
  if (!row) return null;
  return { id: row.id, name: row.name, label: sig.buildLabel(row.name) };
};

export const useHomeFeed = () => {
  const { location } = useLocation();
  const { user } = useAuth();
  const city = location?.city ?? null;
  const state = location?.state ?? null;
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: ["home-feed", userId, city, state],
    queryFn: async (): Promise<FeedSection[]> => {
      const sections: FeedSection[] = [];
      const usedTopicIds = new Set<string>();
      let remainingTopics = TARGET_TOPICS;

      // ---- Tier A: profile-driven personalization (signed in only) ----
      if (userId) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("city, state, college, major, job, birth_year, entity_type")
          .eq("id", userId)
          .maybeSingle();

        if (profile) {
          const signals = buildSignals(profile as ProfileRow);
          const matches: MatchedTopic[] = [];
          for (const sig of signals) {
            if (matches.length >= remainingTopics) break;
            const m = await matchTopicForSignal(sig);
            if (m && !usedTopicIds.has(m.id) && !matches.some((x) => x.id === m.id)) {
              matches.push(m);
            }
          }

          if (matches.length > 0) {
            const postsMap = await fetchPostsForTopics(matches.map((m) => m.id));
            // Each profile match becomes its own labeled section with a single
            // topic card so labels like "Because you're in Florida" stay accurate.
            for (const m of matches) {
              const posts = postsMap.get(m.id) ?? [];
              if (posts.length === 0) continue;
              sections.push({ key: "profile", label: m.label, posts });
              usedTopicIds.add(m.id);
              remainingTopics -= 1;
            }
          }
        }
      }

      const personalizedCount = sections.length;
      const hadPersonalization = personalizedCount > 0;

      // ---- Tier B: city (only when we have NO personalization OR very thin) ----
      if (!hadPersonalization && city && state && remainingTopics > 0) {
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

      // ---- Tier C: state (only when we have NO personalization) ----
      if (!hadPersonalization && state && remainingTopics > 0) {
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

      // ---- Tier D: national / trending tail ----
      // Always show when:
      //   - no personalization happened (original cascade), OR
      //   - personalized column is thin (< MIN_PERSONALIZED_BEFORE_TAIL)
      const needsTail =
        !hadPersonalization || personalizedCount < MIN_PERSONALIZED_BEFORE_TAIL;
      if (needsTail && remainingTopics > 0) {
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
          // Label this tier when there's already content above it.
          const label = sections.length > 0 ? "Trending nationally" : null;
          sections.push({ key: "national", label, posts });
        }
      }

      return sections;
    },
    staleTime: 30_000,
  });
};
