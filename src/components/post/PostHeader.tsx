import { ChevronLeft, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import RankPill from "@/components/post/RankPill";

interface PostHeaderProps {
  title: string;
  rank: number;
  total: number;
  topicName: string;
  averageRating: number;
  ratingCount: number;
}

const PostHeader = ({
  title,
  rank,
  total,
  topicName,
  averageRating,
  ratingCount,
}: PostHeaderProps) => {
  const navigate = useNavigate();
  const backHref = `/topic/${encodeURIComponent(topicName)}`;

  return (
    <header className="space-y-[var(--space-rhythm-tight)]">
      <div
        className="flex items-center gap-2 text-[var(--font-size-meta)] text-muted-foreground"
        style={{ lineHeight: "var(--line-height-meta)" }}
      >
        <button
          type="button"
          onClick={() => navigate(backHref)}
          className="inline-flex items-center gap-1 text-primary hover:underline bg-transparent border-0 p-0 cursor-pointer font-medium"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back to {topicName}
        </button>
        <span aria-hidden>/</span>
        <span>#{rank}</span>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <RankPill rank={rank} total={total} />
        {ratingCount > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className="inline-flex items-center gap-1 text-[var(--font-size-meta)] text-muted-foreground tabular-nums cursor-default"
                  style={{ lineHeight: "var(--line-height-meta)" }}
                >
                  <Star className="h-3 w-3 fill-secondary text-secondary" />
                  <span className="text-foreground font-semibold">{averageRating}</span>
                  <span>({ratingCount})</span>
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                Average rating from {ratingCount} reader{ratingCount === 1 ? "" : "s"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      <h1
        className="font-heading font-bold text-card-foreground"
        style={{
          fontSize: "var(--font-size-post-title)",
          lineHeight: "var(--line-height-post-title)",
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </h1>
    </header>
  );
};

export default PostHeader;
