import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import type { Post } from "@/data/seedData";

interface TopicPostListItemProps {
  post: Post;
  rank: number;
  topicName: string;
}

/**
 * Editorial row used on the topic page. The whole row is a link to the
 * dedicated subtopic page. Shows rank, title (green/clickable), and the
 * rating score on the right.
 */
const TopicPostListItem = ({ post, rank, topicName }: TopicPostListItemProps) => {
  const seedAvg =
    post.ratingCount > 0
      ? Math.round((post.ratingScore / post.ratingCount) * 10) / 10
      : 0;
  const displayTitle = post.title || post.content;

  return (
    <Link
      to={`/topic/${encodeURIComponent(topicName)}/post/${rank}`}
      className="group flex items-baseline gap-4 py-3 border-b border-border/60 hover:bg-muted/40 transition-colors"
    >
      <span className="w-8 shrink-0 text-right text-sm text-muted-foreground tabular-nums">
        {rank}.
      </span>
      <h3 className="flex-1 min-w-0 truncate text-sm md:text-base font-heading font-semibold text-primary group-hover:underline">
        {displayTitle}
      </h3>
      <span className="shrink-0 flex items-center gap-1 text-xs text-muted-foreground">
        <Star className="h-3 w-3 fill-secondary text-secondary" />
        <span className="text-foreground font-semibold">{seedAvg}</span>
        <span>({post.ratingCount})</span>
      </span>
    </Link>
  );
};

export default TopicPostListItem;
