import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import { Post, getTimeAgo } from "@/data/seedData";
import PostActionMenu from "@/components/PostActionMenu";
import UserAvatar from "@/components/UserAvatar";

interface PostCardProps {
  post: Post;
}

const PostCard = ({ post }: PostCardProps) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const contentRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = contentRef.current;
    if (el) {
      setIsClamped(el.scrollHeight > el.clientHeight);
    }
  }, [post.content]);

  return (
    <div
      className="group rounded-xl border bg-card p-4 hover:shadow-md transition-all duration-200 cursor-pointer"
      onClick={() => navigate(`/topic/${encodeURIComponent(post.topicName)}`)}
    >
      <h3 className="font-bold text-primary font-heading mb-1 group-hover:underline">{post.topicName}</h3>
      <p
        ref={contentRef}
        className={`text-sm text-card-foreground leading-relaxed mb-1 ${expanded ? "" : "line-clamp-3"}`}
      >
        {post.content}
      </p>
      {isClamped && (
        <button
          className="text-xs text-muted-foreground underline mb-2"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((prev) => !prev);
          }}
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}

      {post.imageUrl && (
        <img
          src={post.imageUrl}
          alt={post.topicName}
          className="w-full h-36 object-cover rounded-lg mb-3"
        />
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <UserAvatar username={post.username} size="sm" />
          <span>· {getTimeAgo(post.createdAt)}</span>
        </span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" />
            {post.commentCount}
          </span>
          <PostActionMenu postId={post.id} topicName={post.topicName} />
        </div>
      </div>
    </div>
  );
};

export default PostCard;
