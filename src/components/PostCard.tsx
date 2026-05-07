import { Link, useNavigate } from "react-router-dom";
import type { MouseEvent } from "react";
import { MessageSquare, Share2 } from "lucide-react";
import { Post, getTimeAgo } from "@/data/seedData";
import UserRatingIndicator from "@/components/UserRatingIndicator";
import { useToast } from "@/hooks/use-toast";
import { slugifyPostTitle } from "@/lib/postSlug";

interface PostCardProps {
  post: Post;
}

const PostCard = ({ post }: PostCardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const openTopic = () => navigate(`/topic/${encodeURIComponent(post.topicName)}`);
  const contentText = post.title || post.content;
  const postSlug = slugifyPostTitle(contentText) || post.id;
  const postHref = `/topic/${encodeURIComponent(post.topicName)}/post/${postSlug}`;
  const handleShare = async (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const url = `${window.location.origin}${postHref}`;

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: contentText, url });
        return;
      } catch (err) {
        if ((err as DOMException)?.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied", description: url });
    } catch {
      toast({
        title: "Couldn't copy link",
        description: url,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="group py-4 border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          openTopic();
        }}
        className="mb-2.5 block font-heading text-3xl font-normal leading-tight text-primary hover:underline"
      >
        {post.topicName}
      </button>

      <Link
        to={postHref}
        className="mb-3.5 block text-[15px] leading-snug text-primary hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        {contentText}
      </Link>

      {post.imageUrl && (
        <div className="mb-3.5 aspect-square w-full overflow-hidden bg-muted">
          <img
            src={post.imageUrl}
            alt={post.topicName}
            width={600}
            height={600}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <div className="mb-2 flex flex-wrap items-baseline gap-2 text-base leading-tight">
        <Link
          to={`/profile/${(post as Post & { authorId?: string }).authorId ?? post.username}`}
          onClick={(e) => e.stopPropagation()}
          className="font-semibold text-primary hover:underline"
        >
          {post.username}
        </Link>
        <span className="text-muted-foreground">Posted {getTimeAgo(post.createdAt)}</span>
      </div>

      <div className="flex items-center gap-4 text-base text-foreground/70">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`${postHref}#comments`);
          }}
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
