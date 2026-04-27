import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ThumbsUp, ThumbsDown, CornerDownRight, Reply } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import InlineCommentComposer from "@/components/post/InlineCommentComposer";
import { getTimeAgo } from "@/data/seedData";

export interface DisplayComment {
  id: string;
  username: string;
  content: string;
  createdAt: Date;
  parentCommentId: string | null;
  parentUsername: string | null;
}

interface CommentItemProps {
  comment: DisplayComment;
  postId: string;
  depth: number;
  isReplyOpen: boolean;
  onReplyToggle: (commentId: string | null) => void;
  onReplySubmitted: () => void;
  children?: ReactNode;
}

const INDENT_REM_MOBILE = 1;
const INDENT_REM_DESKTOP = 1.5;
const MAX_INDENT_LEVEL_MOBILE = 5;
const MAX_INDENT_LEVEL_DESKTOP = 8;

const CommentItem = ({
  comment,
  postId,
  depth,
  isReplyOpen,
  onReplyToggle,
  onReplySubmitted,
  children,
}: CommentItemProps) => {
  const [agreed, setAgreed] = useState(false);
  const [disagreed, setDisagreed] = useState(false);

  const indentMobile = Math.min(depth, MAX_INDENT_LEVEL_MOBILE) * INDENT_REM_MOBILE;
  const indentDesktop = Math.min(depth, MAX_INDENT_LEVEL_DESKTOP) * INDENT_REM_DESKTOP;

  return (
    <div
      style={
        {
          "--indent-mobile": `${indentMobile}rem`,
          "--indent-desktop": `${indentDesktop}rem`,
        } as React.CSSProperties
      }
      className="pl-[var(--indent-mobile)] sm:pl-[var(--indent-desktop)]"
    >
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
            {comment.parentUsername && (
              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <CornerDownRight className="h-3 w-3" aria-hidden />
                <span>Replying to</span>
                <Link
                  to={`/profile/${comment.parentUsername}`}
                  className="text-primary hover:underline font-medium"
                >
                  @{comment.parentUsername}
                </Link>
              </div>
            )}
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
              <button
                onClick={() => onReplyToggle(isReplyOpen ? null : comment.id)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                aria-expanded={isReplyOpen}
              >
                <Reply className="h-3.5 w-3.5" />
                Reply
              </button>
            </div>
            {isReplyOpen && (
              <div className="mt-3">
                <InlineCommentComposer
                  postId={postId}
                  parentCommentId={comment.id}
                  parentUsername={comment.username}
                  autoFocus
                  onCancel={() => onReplyToggle(null)}
                  onSubmitted={onReplySubmitted}
                />
              </div>
            )}
          </div>
        </div>
      </article>
      {children}
    </div>
  );
};

export default CommentItem;
