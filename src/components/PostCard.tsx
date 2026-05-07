import { Link, useNavigate } from "react-router-dom";
import type { MouseEvent } from "react";
import { MessageSquare, Share2 } from "lucide-react";
import { Post, getTimeAgo } from "@/data/seedData";
import UserRatingIndicator from "@/components/UserRatingIndicator";

interface PostCardProps {
  post: Post;
  postRank?: number;
}

const PostCard = ({ post, postRank }: PostCardProps) => {
  const navigate = useNavigate();

  const openTopic = () => navigate(`/topic/${encodeURIComponent(post.topicName)}`);
  const linksToPost = typeof postRank === "number";
  const postHref = linksToPost
    ? `/topic/${encodeURIComponent(post.topicName)}/post/${postRank}`
    : null;
  const contentText = post.title || post.content;
  const handleShare = async (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const url = postHref ? `${window.location.origin}${postHref}` : `${window.location.origin}/topic/${encodeURIComponent(post.topicName)}`;

    if (navigator.share) {
      await navigator.share({ title: contentText, url });
      return;
    }

    await navigator.clipboard?.writeText(url);
  };

  return (
    <div
      className={`group py-4 border-b border-border last:border-b-0 ${
        linksToPost ? "" : "cursor-pointer"
      }`}
      onClick={linksToPost ? undefined : openTopic}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          openTopic();
        }}
        className="mb-2.5 block font-heading text-3xl font-bold leading-none text-primary hover:underline"
      >
        {post.topicName}
      </button>

      {linksToPost && postHref ? (
        <Link
          to={postHref}
          className="mb-3.5 block text-2xl leading-tight text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {contentText}
        </Link>
      ) : (
        <h3 className="mb-3.5 text-2xl leading-tight text-primary">
          {contentText}
        </h3>
      )}

      {post.imageUrl && (
        <div className="mb-3.5 aspect-square w-full overflow-hidden bg-muted">
          <img
            src={post.imageUrl}
            alt={post.topicName}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <div className="mb-2 flex flex-wrap items-baseline gap-2 text-base leading-tight">
        <span className="font-semibold text-foreground/70">{post.username}</span>
        <span className="text-muted-foreground">Posted {getTimeAgo(post.createdAt)}</span>
      </div>

      <div className="flex items-center gap-4 text-base text-foreground/70">
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-2 hover:text-foreground"
        >
          <MessageSquare className="h-5 w-5 fill-current" />
          <span>{post.commentCount} comments</span>
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="flex items-center gap-1 hover:text-foreground"
        >
          <Share2 className="h-5 w-5 fill-current" />
          <span>Share</span>
        </button>
        <span onClick={(e) => e.stopPropagation()}>
          <UserRatingIndicator postId={post.id} size="sm" />
        </span>
      </div>
    </div>
  );
};

export default PostCard;
