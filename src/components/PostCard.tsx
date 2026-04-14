import { useNavigate } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import { Post, getTimeAgo } from "@/data/seedData";
import UserAvatar from "@/components/UserAvatar";

interface PostCardProps {
  post: Post;
}

const PostCard = ({ post }: PostCardProps) => {
  const navigate = useNavigate();

  const openTopic = () => navigate(`/topic/${encodeURIComponent(post.topicName)}`);

  return (
    <div
      className="group cursor-pointer py-3 border-b border-border last:border-b-0"
      onClick={openTopic}
    >
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
        <UserAvatar username={post.username} size="sm" />
        <span>·</span>
        <span>{getTimeAgo(post.createdAt)}</span>
      </div>

      <div className="flex gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-medium text-foreground leading-snug line-clamp-2 mb-2">
            {post.content}
          </h3>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openTopic();
              }}
              className="text-primary hover:underline font-medium truncate max-w-[140px]"
            >
              {post.topicName}
            </button>
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {post.commentCount}
            </span>
          </div>
        </div>

        {post.imageUrl && (
          <img
            src={post.imageUrl}
            alt={post.topicName}
            className="w-16 h-16 rounded-md object-cover shrink-0"
          />
        )}
      </div>
    </div>
  );
};

export default PostCard;
