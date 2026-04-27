import { useState } from "react";
import { Link } from "react-router-dom";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import { getTimeAgo } from "@/data/seedData";

export interface DisplayComment {
  id: string;
  username: string;
  content: string;
  createdAt: Date;
}

interface CommentItemProps {
  comment: DisplayComment;
}

const CommentItem = ({ comment }: CommentItemProps) => {
  const [agreed, setAgreed] = useState(false);
  const [disagreed, setDisagreed] = useState(false);

  return (
    <article>
      <div className="flex gap-3 py-3">
        <UserAvatar username={comment.username} size="md" showName={false} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm">
            <Link
              to={`/profile/${comment.username}`}
              className="font-semibold text-primary hover:underline"
            >
              @{comment.username}
            </Link>
            <span className="text-xs text-muted-foreground">
              {getTimeAgo(comment.createdAt)}
            </span>
          </div>
          <div
            className="prose prose-sm max-w-none text-card-foreground mt-1 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: comment.content }}
          />
          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={() => {
                setAgreed(!agreed);
                if (disagreed) setDisagreed(false);
              }}
              className={`flex items-center gap-1 text-xs transition-colors ${
                agreed ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ThumbsUp className="h-3.5 w-3.5" />
              {agreed ? 1 : 0}
            </button>
            <button
              onClick={() => {
                setDisagreed(!disagreed);
                if (agreed) setAgreed(false);
              }}
              className={`flex items-center gap-1 text-xs transition-colors ${
                disagreed ? "text-destructive" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ThumbsDown className="h-3.5 w-3.5" />
              {disagreed ? 1 : 0}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

export default CommentItem;
