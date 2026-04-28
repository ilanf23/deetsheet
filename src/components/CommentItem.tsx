import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  CornerDownRight,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import InlineCommentComposer from "@/components/post/InlineCommentComposer";
import JudgementReactionsRow from "@/components/post/JudgementReactionsRow";
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

const INDENT_REM_MOBILE = 0.75;
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
  const [vote, setVote] = useState<"up" | "down" | null>(null);

  const indentMobile = Math.min(depth, MAX_INDENT_LEVEL_MOBILE) * INDENT_REM_MOBILE;
  const indentDesktop = Math.min(depth, MAX_INDENT_LEVEL_DESKTOP) * INDENT_REM_DESKTOP;
  const isTopLevel = depth === 0;

  return (
    <div
      style={
        {
          "--indent-mobile": `${indentMobile}rem`,
          "--indent-desktop": `${indentDesktop}rem`,
        } as React.CSSProperties
      }
      className={`pl-[var(--indent-mobile)] sm:pl-[var(--indent-desktop)] ${
        isTopLevel
          ? "border-b border-border pb-[var(--space-rhythm-block)] mb-[var(--space-rhythm-block)] last:border-b-0 last:pb-0 last:mb-0"
          : "mt-[var(--space-rhythm-block)]"
      }`}
    >
      <article id={`comment-${comment.id}`}>
        <header className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2 min-w-0">
            <UserAvatar username={comment.username} size="sm" showName={false} />
            <div className="flex flex-col leading-tight min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <Link
                  to={`/profile/${comment.username}`}
                  className="font-semibold text-primary hover:underline text-sm"
                >
                  {comment.username}
                </Link>
                {comment.parentCommentId && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <CornerDownRight className="h-3 w-3" aria-hidden />
                    <a
                      href={`#comment-${comment.parentCommentId}`}
                      onClick={(e) => {
                        e.preventDefault();
                        const target = document.getElementById(
                          `comment-${comment.parentCommentId}`
                        );
                        if (!target) return;
                        const prefersReduced = window.matchMedia(
                          "(prefers-reduced-motion: reduce)"
                        ).matches;
                        target.scrollIntoView({
                          behavior: prefersReduced ? "auto" : "smooth",
                          block: "center",
                        });
                      }}
                      className="text-primary hover:underline"
                    >
                      parent
                    </a>
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                Posted {getTimeAgo(comment.createdAt)}
              </span>
            </div>
          </div>

          <div className="shrink-0">
            {isTopLevel ? (
              <JudgementReactionsRow />
            ) : (
              <div className="flex items-center gap-3 text-sm">
                <button
                  type="button"
                  onClick={() => setVote(vote === "up" ? null : "up")}
                  aria-label={vote === "up" ? "Remove upvote" : "Upvote"}
                  aria-pressed={vote === "up"}
                  className={`transition-colors ${
                    vote === "up"
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <ThumbsUp
                    className={`h-4 w-4 ${vote === "up" ? "fill-primary/20" : ""}`}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => setVote(vote === "down" ? null : "down")}
                  aria-label={vote === "down" ? "Remove downvote" : "Downvote"}
                  aria-pressed={vote === "down"}
                  className={`transition-colors ${
                    vote === "down"
                      ? "text-destructive"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <ThumbsDown
                    className={`h-4 w-4 ${
                      vote === "down" ? "fill-destructive/20" : ""
                    }`}
                  />
                </button>
              </div>
            )}
          </div>
        </header>

        <div
          className="text-[0.95rem] text-card-foreground mt-2 leading-relaxed [&_p]:my-1 [&_a]:text-primary [&_a]:underline"
          dangerouslySetInnerHTML={{ __html: comment.content }}
        />

        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={() => onReplyToggle(isReplyOpen ? null : comment.id)}
            aria-expanded={isReplyOpen}
            className="text-sm text-primary hover:underline"
          >
            reply
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
      </article>
      {children}
    </div>
  );
};

export default CommentItem;
