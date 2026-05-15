import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  CornerDownRight,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Plus,
} from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import InlineCommentComposer from "@/components/post/InlineCommentComposer";
import JudgementReactionsRow from "@/components/post/JudgementReactionsRow";
import { getTimeAgo } from "@/data/seedData";

export interface DisplayComment {
  id: string;
  username: string;
  avatarUrl: string | null;
  content: string;
  createdAt: Date;
  likeCount: number;
  parentCommentId: string | null;
  parentUsername: string | null;
}

export type CommentNode = DisplayComment & {
  children: CommentNode[];
  descendantCount: number;
};

interface CommentItemProps {
  node: CommentNode;
  postId: string;
  depth: number;
  openReplyId: string | null;
  onReplyToggle: (commentId: string | null) => void;
  onReplySubmitted: () => void;
}

const MAX_VISUAL_DEPTH = 8;

const CommentItem = ({
  node,
  postId,
  depth,
  openReplyId,
  onReplyToggle,
  onReplySubmitted,
}: CommentItemProps) => {
  const isReplyOpen = openReplyId === node.id;
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [expandedPastMax, setExpandedPastMax] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = contentRef.current;
    if (!el || expanded || collapsed) return;
    const check = () => {
      setIsOverflowing(el.scrollHeight > el.clientHeight + 1);
    };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [node.content, expanded, collapsed]);

  const isTopLevel = depth === 0;
  const hasChildren = node.children.length > 0;
  const tooDeep = depth >= MAX_VISUAL_DEPTH && !expandedPastMax;

  return (
    <div
      className={`relative pl-3 sm:pl-6 pb-[var(--space-rhythm-block)] last:pb-0 ${
        isTopLevel ? "border-b border-border last:border-b-0" : ""
      }`}
    >
      <button
        type="button"
        aria-label={
          collapsed
            ? `Expand comment by ${node.username}`
            : `Collapse comment by ${node.username}`
        }
        aria-expanded={!collapsed}
        onClick={() => setCollapsed((v) => !v)}
        className="absolute left-[5px] sm:left-[11px] top-0 bottom-0 w-px bg-border hover:bg-primary focus-visible:bg-primary transition-colors cursor-pointer before:content-[''] before:absolute before:inset-y-0 before:-inset-x-2"
      />
      <span
        aria-hidden="true"
        className="absolute left-[5px] sm:left-[11px] top-[20px] w-[7px] sm:w-[13px] h-1 border-l border-t border-border rounded-tl-[4px] pointer-events-none"
      />
      <article id={`comment-${node.id}`}>
        <header className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2 min-w-0">
            <UserAvatar
              username={node.username}
              avatarUrl={node.avatarUrl ?? undefined}
              size="lg"
              showName={false}
            />
            <div className="flex flex-col leading-tight min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <Link
                  to={`/profile/${node.username}`}
                  className="font-semibold text-primary hover:underline text-sm"
                >
                  {node.username}
                </Link>
                {(hasChildren || collapsed) && (
                  <button
                    type="button"
                    onClick={() => setCollapsed((v) => !v)}
                    aria-expanded={!collapsed}
                    aria-label={
                      collapsed
                        ? `Expand comment by ${node.username}`
                        : `Collapse comment by ${node.username}`
                    }
                    className="inline-flex items-center justify-center h-4 w-4 rounded-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {collapsed ? (
                      <Plus className="h-3 w-3" aria-hidden />
                    ) : (
                      <Minus className="h-3 w-3" aria-hidden />
                    )}
                  </button>
                )}
                {node.parentCommentId && !collapsed && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <CornerDownRight className="h-3 w-3" aria-hidden />
                    <a
                      href={`#comment-${node.parentCommentId}`}
                      onClick={(e) => {
                        e.preventDefault();
                        const target = document.getElementById(
                          `comment-${node.parentCommentId}`
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
                {collapsed && node.descendantCount > 0 && (
                  <span className="text-xs text-muted-foreground">
                    · {node.descendantCount} hidden{" "}
                    {node.descendantCount === 1 ? "reply" : "replies"}
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                Posted {getTimeAgo(node.createdAt)}
              </span>
            </div>
          </div>

          {!collapsed && (
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
          )}
        </header>

        <div hidden={collapsed}>
          <div
            ref={contentRef}
            className={`text-[1.0125rem] text-card-foreground mt-2 leading-relaxed [&_p]:my-1 [&_a]:text-primary [&_a]:underline ${
              expanded ? "" : "line-clamp-3"
            }`}
            dangerouslySetInnerHTML={{ __html: node.content }}
          />

          <div className="mt-2 flex items-center justify-between gap-3">
            {isOverflowing ? (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded}
                className="text-sm text-primary hover:underline"
              >
                {expanded ? "Show less" : "Show more"}
              </button>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={() => onReplyToggle(isReplyOpen ? null : node.id)}
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
                parentCommentId={node.id}
                parentUsername={node.username}
                autoFocus
                onCancel={() => onReplyToggle(null)}
                onSubmitted={onReplySubmitted}
              />
            </div>
          )}
        </div>
      </article>

      {hasChildren && !tooDeep && (
        <div hidden={collapsed} className="mt-3">
          {node.children.map((child) => (
            <CommentItem
              key={child.id}
              node={child}
              postId={postId}
              depth={depth + 1}
              openReplyId={openReplyId}
              onReplyToggle={onReplyToggle}
              onReplySubmitted={onReplySubmitted}
            />
          ))}
        </div>
      )}

      {hasChildren && !collapsed && tooDeep && (
        <button
          type="button"
          onClick={() => setExpandedPastMax(true)}
          className="text-sm text-primary hover:underline mt-2 block text-left"
        >
          Continue this thread →
        </button>
      )}
    </div>
  );
};

export default CommentItem;
