import { MessageSquare, Share2, Star } from "lucide-react";
import { Post, getAverageRating, getTimeAgo } from "@/data/seedData";

interface PostCardProps {
  post: Post;
}

const PostCard = ({ post }: PostCardProps) => {
  const avgRating = getAverageRating(post);

  return (
    <div className="group rounded-xl border bg-card p-4 hover:shadow-md transition-all duration-200 animate-slide-in cursor-pointer">
      {/* Topic badge */}
      <div className="flex items-center justify-between mb-2">
        <span className="inline-flex items-center rounded-md bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
          {post.topicName}
        </span>
        <span className="text-xs text-muted-foreground">{getTimeAgo(post.createdAt)}</span>
      </div>

      {/* Content */}
      <p className="text-sm font-medium text-card-foreground leading-relaxed mb-3">
        {post.content}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>@{post.username}</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 text-secondary fill-secondary" />
            <span className="font-semibold text-foreground">{avgRating}</span>
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" />
            {post.commentCount}
          </span>
          <button className="hover:text-foreground transition">
            <Share2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostCard;
