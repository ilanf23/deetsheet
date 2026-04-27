import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Post } from "@/data/seedData";

interface PrevNextRankPagerProps {
  topicName: string;
  rank: number;
  prev?: Post;
  next?: Post;
}

const PrevNextRankPager = ({ topicName, rank, prev, next }: PrevNextRankPagerProps) => {
  if (!prev && !next) return null;

  const prevHref = prev ? `/topic/${encodeURIComponent(topicName)}/post/${rank - 1}` : null;
  const nextHref = next ? `/topic/${encodeURIComponent(topicName)}/post/${rank + 1}` : null;

  return (
    <nav
      className="border-y border-border py-4"
      style={{ maxWidth: "var(--reading-max-width)" }}
      aria-label="Ranked answer navigation"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {prevHref && prev ? (
          <Link
            to={prevHref}
            aria-label={`Previous answer: #${rank - 1} ${prev.title || prev.content}`}
            className="group flex items-start gap-2 p-2 -mx-2 rounded-md hover:bg-accent/40 transition-colors"
          >
            <ChevronLeft className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
            <div className="min-w-0">
              <div className="text-[var(--font-size-meta)] uppercase tracking-wide text-muted-foreground" style={{ letterSpacing: "var(--letter-spacing-rank-pill)" }}>
                Previous · #{rank - 1}
              </div>
              <div className="text-sm text-primary group-hover:underline line-clamp-1 mt-0.5">
                {prev.title || prev.content}
              </div>
            </div>
          </Link>
        ) : (
          <div aria-hidden />
        )}
        {nextHref && next ? (
          <Link
            to={nextHref}
            aria-label={`Next answer: #${rank + 1} ${next.title || next.content}`}
            className="group flex items-start gap-2 p-2 -mx-2 rounded-md hover:bg-accent/40 transition-colors text-right sm:justify-end"
          >
            <div className="min-w-0 sm:order-1">
              <div className="text-[var(--font-size-meta)] uppercase tracking-wide text-muted-foreground" style={{ letterSpacing: "var(--letter-spacing-rank-pill)" }}>
                Next · #{rank + 1}
              </div>
              <div className="text-sm text-primary group-hover:underline line-clamp-1 mt-0.5">
                {next.title || next.content}
              </div>
            </div>
            <ChevronRight className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0 group-hover:text-primary transition-colors sm:order-2" />
          </Link>
        ) : (
          <div aria-hidden />
        )}
      </div>
    </nav>
  );
};

export default PrevNextRankPager;
