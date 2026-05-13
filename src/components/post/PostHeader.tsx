import { Link } from "react-router-dom";
import PostRatingBox from "@/components/post/PostRatingBox";
import FollowPostButton from "@/components/FollowPostButton";
import { formatTitle } from "@/lib/formatTitle";

interface PostHeaderProps {
  title: string;
  rank: number;
  topicName: string;
  postId: string;
  averageRating: number;
  ratingCount: number;
  followerCount?: number;
  onRatingChanged?: () => void;
}

const PostHeader = ({
  title,
  rank,
  topicName,
  postId,
  averageRating,
  ratingCount,
  followerCount,
  onRatingChanged,
}: PostHeaderProps) => {
  const postHref = `/topic/${encodeURIComponent(topicName)}/${rank}`;
  return (
    <header className="flex flex-col md:flex-row md:items-start gap-4">
      <div className="flex-1 min-w-0 space-y-3">
        <h1
          className="font-heading font-bold break-words flex items-start gap-2"
          style={{
            fontSize: "var(--font-size-post-title)",
            lineHeight: "var(--line-height-post-title)",
            letterSpacing: "-0.01em",
          }}
        >
          <span className="tabular-nums text-muted-foreground shrink-0">
            {rank}.
          </span>
          <Link
            to={postHref}
            className="text-primary hover:underline min-w-0 flex-1"
          >
            {formatTitle(title)}
          </Link>
        </h1>
        <FollowPostButton postId={postId} initialCount={followerCount} />
      </div>
      <PostRatingBox
        postId={postId}
        averageRating={averageRating}
        ratingCount={ratingCount}
        onRatingChanged={onRatingChanged}
      />
    </header>
  );
};

export default PostHeader;
