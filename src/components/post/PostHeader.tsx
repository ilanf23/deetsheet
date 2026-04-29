import PostRatingBox from "@/components/post/PostRatingBox";

interface PostHeaderProps {
  title: string;
  rank: number;
  topicName: string;
  postId: string;
  averageRating: number;
  ratingCount: number;
  onRatingChanged?: () => void;
}

const PostHeader = ({
  title,
  rank,
  postId,
  averageRating,
  ratingCount,
  onRatingChanged,
}: PostHeaderProps) => {
  return (
    <header className="flex flex-col md:flex-row md:items-start gap-4">
      <div className="flex items-baseline gap-3 flex-1 min-w-0">
        <span
          className="font-heading text-muted-foreground tabular-nums shrink-0"
          style={{
            fontSize: "var(--font-size-post-title)",
            lineHeight: "var(--line-height-post-title)",
          }}
          aria-hidden
        >
          {rank}.
        </span>
        <h1
          className="font-heading font-bold text-primary min-w-0 break-words"
          style={{
            fontSize: "var(--font-size-post-title)",
            lineHeight: "var(--line-height-post-title)",
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </h1>
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
