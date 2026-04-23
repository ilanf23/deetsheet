import { Link } from "react-router-dom";
import { Star, ChevronRight } from "lucide-react";
import type { Post } from "@/data/seedData";
import UserAvatar from "@/components/UserAvatar";

interface TopicPostListItemProps {
  post: Post;
  rank: number;
  topicName: string;
}

/**
 * Compact row used on the topic page. The whole row is a link to the
 * dedicated subtopic page (/topic/:topicName/post/:rank). Shows rank,
 * title, rating, author, and a 1-line content preview.
 */
const TopicPostListItem = ({ post, rank, topicName }: TopicPostListItemProps) => {
  const seedAvg =
    post.ratingCount > 0
      ? Math.round((post.ratingScore / post.ratingCount) * 10) / 10
      : 0;
  const displayTitle = post.title || post.content;

  // Strip HTML for the 1-line preview.
  const previewSource = post.title ? post.content : "";
  const preview = previewSource
    ? previewSource.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()
    : "";

  return (
    <Link
      to={`/topic/${encodeURIComponent(topicName)}/post/${rank}`}
      className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
    >
      <span className="text-lg font-bold text-primary w-8 shrink-0 text-right pt-0.5">
        {rank}.
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <h3 className="flex-1 text-sm font-semibold text-primary leading-snug truncate hover:underline">
            {displayTitle}
          </h3>
          <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
            <Star className="h-3 w-3 text-secondary fill-secondary" />
            <span className="font-semibold text-foreground">{seedAvg}</span>
            <span>({post.ratingCount})</span>
          </span>
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <UserAvatar username={post.username} size="sm" />
          <span className="truncate">@{post.username}</span>
        </div>
        {preview && (
          <p className="mt-1.5 text-xs text-muted-foreground line-clamp-1">
            {preview}
          </p>
        )}
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
    </Link>
  );
};

export default TopicPostListItem;
