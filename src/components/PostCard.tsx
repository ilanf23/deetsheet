import { useNavigate } from "react-router-dom";
import { MessageSquare, Share2 } from "lucide-react";
import { Post, getTimeAgo } from "@/data/seedData";

interface PostCardProps {
  post: Post;
}

const PostCard = ({ post }: PostCardProps) => {
  const navigate = useNavigate();
  return (
    <div
      className="group rounded-xl border bg-card p-4 hover:shadow-md transition-all duration-200 cursor-pointer"
      onClick={() => navigate(`/topic/${encodeURIComponent(post.topicName)}`)}
    >
      <h3 className="font-bold text-card-foreground font-heading mb-1">{post.topicName}</h3>
      <p className="text-sm text-card-foreground leading-relaxed mb-3">{post.content}</p>

      {post.imageUrl && (
        <img
          src={post.imageUrl}
          alt={post.topicName}
          className="w-full h-36 object-cover rounded-lg mb-3"
        />
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>@{post.username} · {getTimeAgo(post.createdAt)}</span>
        <div className="flex items-center gap-3">
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
