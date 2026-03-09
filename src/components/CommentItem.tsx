import { useState } from "react";
import { ThumbsUp, Heart } from "lucide-react";
import { Comment, getReplies, getTimeAgo } from "@/data/seedData";

interface CommentItemProps {
  comment: Comment;
  depth?: number;
}

const CommentItem = ({ comment, depth = 0 }: CommentItemProps) => {
  const [agreed, setAgreed] = useState(false);
  const [hearted, setHearted] = useState(false);
  const replies = getReplies(comment.id);
  const maxDepth = 3;

  return (
    <div className={depth > 0 ? "ml-8" : ""}>
      <div className="flex gap-3 py-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold shrink-0">
          {comment.username[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-card-foreground">@{comment.username}</span>
            <span className="text-xs text-muted-foreground">{getTimeAgo(comment.createdAt)}</span>
          </div>
          <div
            className="prose prose-sm max-w-none text-card-foreground mt-1"
            dangerouslySetInnerHTML={{ __html: comment.content }}
          />
          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={() => setAgreed(!agreed)}
              className={`flex items-center gap-1 text-xs transition-colors ${agreed ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              <ThumbsUp className="h-3.5 w-3.5" />
              {comment.agreeCount + (agreed ? 1 : 0)}
            </button>
            <button
              onClick={() => setHearted(!hearted)}
              className={`flex items-center gap-1 text-xs transition-colors ${hearted ? "text-red-500" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Heart className={`h-3.5 w-3.5 ${hearted ? "fill-red-500" : ""}`} />
              {comment.heartCount + (hearted ? 1 : 0)}
            </button>
            <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              reply
            </button>
          </div>
        </div>
      </div>
      {depth < maxDepth && replies.map((reply) => (
        <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
      ))}
    </div>
  );
};

export default CommentItem;
