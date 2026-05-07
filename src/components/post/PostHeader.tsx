import { Link } from "react-router-dom";
import PostRatingBox from "@/components/post/PostRatingBox";
import FollowPostButton from "@/components/FollowPostButton";

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
          className="font-heading font-bold break-words"
          style={{
            fontSize: "var(--font-size-post-title)",
            lineHeight: "var(--line-height-post-title)",
            letterSpacing: "-0.01em",
          }}
        >
          <Link
            to={postHref}
            className="text-primary hover:underline"
          >
            <span
              className="tabular-nums mr-2"
              style={{
                fontSize: "var(--font-size-post-title)",
                lineHeight: "var(--line-height-post-title)",
              }}
            >
              {rank}.
            </span>
            {title}
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
