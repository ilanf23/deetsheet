import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useHomeFeed, type FeedPost, type FeedSection } from "@/hooks/useHomeFeed";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import UserRatingIndicator from "@/components/UserRatingIndicator";
import { topics as seedTopics } from "@/data/seedData";
import { getTopicSubtitle } from "@/hooks/useSupabaseTopics";

/**
 * Cascading city → state → national feed for the homepage.
 *
 * Visually identical to <PopularTopicSection> — we group the section's
 * posts by topic and render one PopularTopicSection-shaped box per topic
 * (header + image + numbered list with the Rating | You column).
 *
 * "Show all locations" toggle is the spec-required escape hatch.
 */
const HomeFeed = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showTrending, setShowTrending] = useState(false);
  const { data: sections, isLoading } = useHomeFeed();

  // "Show trending instead" hides personalization and shows only the national tier
  // (escape hatch required by the SOW).
  const visibleSections: FeedSection[] = useMemo(() => {
    if (!sections) return [];
    if (!showTrending) return sections;
    const national = sections.filter((s) => s.key === "national");
    if (national.length > 0) return national.map((s) => ({ ...s, label: null }));
    // If the cached feed didn't include a national tier, fall back to whatever we have.
    return sections.map((s) => ({ ...s, label: null }));
  }, [sections, showTrending]);

  return (
    <div>
      {/* Header bar — matches the existing "Most Popular" treatment so the column doesn't feel grafted on. */}
      <div className="flex items-center justify-between h-8 mb-4 px-1 pb-2 border-b border-border">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          For You
        </h2>
        <div className="flex items-center gap-2">
          <Label htmlFor="show-trending" className="text-xs text-muted-foreground cursor-pointer">
            Show trending instead
          </Label>
          <Switch id="show-trending" checked={showTrending} onCheckedChange={setShowTrending} />
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-10 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          <span className="text-sm">Loading your feed…</span>
        </div>
      )}

      {!isLoading && visibleSections.length === 0 && (
        <p className="text-sm text-muted-foreground py-6 text-center">
          No posts yet. Check back soon.
        </p>
      )}

      <div className="space-y-6">
        {visibleSections.map((section) => (
          <FeedTier
            key={section.key}
            section={section}
            onRatingChanged={() => queryClient.invalidateQueries({ queryKey: ["home-feed"] })}
            onNavigate={(topicName) => navigate(`/topic/${encodeURIComponent(topicName)}`)}
          />
        ))}
      </div>
    </div>
  );
};

interface FeedTierProps {
  section: FeedSection;
  onRatingChanged: () => void;
  onNavigate: (topicName: string) => void;
}

/**
 * One tier of the cascade. Posts are grouped by topic and each topic is
 * rendered as a PopularTopicSection-style card so the visual treatment
 * matches the rest of the column.
 */
const FeedTier = ({ section, onRatingChanged, onNavigate }: FeedTierProps) => {
  // Group posts under their topic, preserving order.
  const groups = useMemo(() => {
    const map = new Map<string, FeedPost[]>();
    for (const post of section.posts) {
      const list = map.get(post.topicName) ?? [];
      list.push(post);
      map.set(post.topicName, list);
    }
    return Array.from(map.entries());
  }, [section.posts]);

  return (
    <section className="space-y-3">
      {section.label && (
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
          {section.label}
        </h3>
      )}
      <div className="space-y-4">
        {groups.map(([topicName, posts]) => (
          <FeedTopicCard
            key={`${section.key}-${topicName}`}
            topicName={topicName}
            posts={posts}
            onRatingChanged={onRatingChanged}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </section>
  );
};

interface FeedTopicCardProps {
  topicName: string;
  posts: FeedPost[];
  onRatingChanged: () => void;
  onNavigate: (topicName: string) => void;
}

/**
 * A single topic card in the For You feed. Mirrors PopularTopicSection
 * exactly: header (title + subtitle, "Rating | You" label), image-left,
 * numbered list with average rating + UserRatingIndicator on the right.
 */
const FeedTopicCard = ({ topicName, posts, onRatingChanged, onNavigate }: FeedTopicCardProps) => {
  // Pull image + categoryName off the seed catalog so the card matches PopularTopicSection.
  const seed = seedTopics.find((t) => t.name === topicName);
  const categoryName = seed?.categoryName;
  const subtitle = getTopicSubtitle(topicName, categoryName);
  const imageUrl = seed?.imageUrl;
  const topPosts = posts.slice(0, 5);

  return (
    <div
      className="border rounded-xl bg-background cursor-pointer hover:shadow-lg transition-all duration-200 p-5"
      onClick={() => onNavigate(topicName)}
    >
      {/* Header: title + subtitle on the left, Rating|You label on the right */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0">
          <h3 className="font-heading text-3xl font-normal text-primary leading-tight truncate">
            {topicName}
          </h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        <span className="text-[11px] text-muted-foreground shrink-0 pt-2 whitespace-nowrap">
          Rating <span className="mx-0.5">|</span> You
        </span>
      </div>

      {/* Body: image on the left, numbered list + ratings on the right */}
      <div className="flex gap-5">
        {imageUrl && (
          <img
            src={imageUrl}
            alt={topicName}
            className="w-32 sm:w-36 self-start rounded object-cover shrink-0 aspect-square"
          />
        )}
        <ol className="flex-1 min-w-0 space-y-2">
          {topPosts.map((post, i) => (
            <li key={post.id} className="flex items-center gap-3 text-[15px] min-w-0">
              <span className="text-muted-foreground w-5 shrink-0 text-right">{i + 1}.</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate(topicName);
                }}
                className="flex-1 min-w-0 text-left text-primary leading-snug truncate hover:underline"
              >
                {post.title || post.content}
              </button>
              <span className="flex items-center text-secondary shrink-0 tabular-nums">
                <span className="font-medium w-8 text-right">{post.averageRating.toFixed(1)}</span>
                <span className="text-muted-foreground/60 w-4 text-center">|</span>
                <span className="w-8 flex justify-center">
                  <UserRatingIndicator postId={post.id} onRatingChanged={onRatingChanged} />
                </span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
};

export default HomeFeed;
