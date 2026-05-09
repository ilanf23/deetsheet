import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import type { Post } from "@/data/seedData";
import UserRatingIndicator from "@/components/UserRatingIndicator";
import { slugifyPostTitle } from "@/lib/postSlug";

interface TopicPostListItemProps {
  post: Post;
  rank: number;
  topicName: string;
  topicId: string;
  showRanking?: boolean;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const TopicPostListItem = ({ post, rank, topicName, topicId, showRanking = true }: TopicPostListItemProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const seedAvg =
    post.ratingCount > 0
      ? Math.round((post.ratingScore / post.ratingCount) * 10) / 10
      : 0;
  const displayTitle = post.title || post.content;
  const isDbPost = UUID_RE.test(post.id);

  const goToPost = () => {
    const slug = slugifyPostTitle(displayTitle) || String(rank);
    navigate(`/topic/${encodeURIComponent(topicName)}/post/${slug}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      goToPost();
    }
  };

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={goToPost}
      onKeyDown={handleKeyDown}
      className="group flex items-baseline gap-4 px-3 py-3.5 -mx-3 rounded-md hover:bg-accent/60 transition-colors duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {showRanking && (
        <span className="w-8 shrink-0 text-right text-sm text-muted-foreground tabular-nums">
          {rank}.
        </span>
      )}
      <h3 className="flex-1 min-w-0 truncate text-sm md:text-base font-heading font-semibold text-primary group-hover:underline">
        {displayTitle}
      </h3>
      {showRanking && (
        <>
          <span className="shrink-0 flex items-baseline gap-1 text-sm md:text-base font-heading text-muted-foreground tabular-nums">
            <span className="w-8 text-right text-secondary font-semibold">{seedAvg}</span>
            <span className="text-xs">({post.ratingCount})</span>
          </span>
          <span className="shrink-0 text-muted-foreground/60 text-sm md:text-base" aria-hidden>|</span>
          {isDbPost ? (
            <span
              className="shrink-0 w-8 flex justify-center"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <UserRatingIndicator
                postId={post.id}
                onRatingChanged={() => {
                  queryClient.invalidateQueries({ queryKey: ["posts-by-topic", topicId] });
                }}
                size="title"
              />
            </span>
          ) : (
            <span className="shrink-0 w-8" aria-hidden />
          )}
        </>
      )}
    </div>
  );
};

export default TopicPostListItem;
