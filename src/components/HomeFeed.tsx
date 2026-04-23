import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useHomeFeed } from "@/hooks/useHomeFeed";
import { useLocation } from "@/contexts/LocationContext";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState } from "react";

/**
 * Cascading city → state → national feed for the homepage.
 * Renders one section per tier with a clear, non-intrusive header.
 *
 * Includes a "Show all locations" toggle as the spec-required escape
 * hatch — when on, we render only the national tier regardless of the
 * visitor's saved location.
 */
const HomeFeed = () => {
  const navigate = useNavigate();
  const { location } = useLocation();
  const [showAll, setShowAll] = useState(false);
  const { data: sections, isLoading } = useHomeFeed();

  const visibleSections = showAll
    ? (sections ?? []).filter((s) => s.key === "national").map((s) => ({ ...s, label: null }))
    : sections ?? [];

  return (
    <div>
      {/* Header bar — matches the existing "Most Popular" treatment so the column doesn't feel grafted on. */}
      <div className="flex items-center justify-between h-8 mb-4 px-1 pb-2 border-b border-border">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          For You
        </h2>
        {location && (
          <div className="flex items-center gap-2">
            <Label htmlFor="show-all" className="text-xs text-muted-foreground cursor-pointer">
              Show all locations
            </Label>
            <Switch id="show-all" checked={showAll} onCheckedChange={setShowAll} />
          </div>
        )}
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
          <section key={section.key} className="space-y-2">
            {section.label && (
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
                {section.label}
              </h3>
            )}
            <ul className="space-y-2">
              {section.posts.map((post) => (
                <li
                  key={post.id}
                  className="border rounded-lg bg-background p-3 hover:shadow-sm transition-shadow"
                >
                  <button
                    type="button"
                    onClick={() => navigate(`/topic/${encodeURIComponent(post.topicName)}`)}
                    className="text-left w-full"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                          {post.topicName}
                          {post.city && post.state && (
                            <span className="ml-2 normal-case tracking-normal text-muted-foreground/70">
                              · {post.city}, {post.state}
                            </span>
                          )}
                        </p>
                        <p className="text-primary leading-snug text-sm mt-0.5 hover:underline line-clamp-2">
                          {post.title}
                        </p>
                      </div>
                      <span className="text-secondary text-sm tabular-nums shrink-0 pt-1">
                        {post.averageRating.toFixed(1)}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
};

export default HomeFeed;
