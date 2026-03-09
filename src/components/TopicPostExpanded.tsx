import { useState, useRef } from "react";
import { ThumbsUp, CheckCircle, MessageSquare, Heart, Flag, Send, ChevronDown, ChevronRight, Star, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { Post, getAverageRating, getTimeAgo, getCommentsByPost } from "@/data/seedData";
import CommentItem from "@/components/CommentItem";
import StarRatingBar from "@/components/StarRatingBar";
import RichTextEditor from "@/components/RichTextEditor";
import PostActionMenu from "@/components/PostActionMenu";
import type { Editor } from "@tiptap/react";

interface TopicPostExpandedProps {
  post: Post;
  rank: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  isAuthenticated: boolean;
}

const TopicPostExpanded = ({ post, rank, isExpanded, onToggleExpand, isAuthenticated }: TopicPostExpandedProps) => {
  const avg = getAverageRating(post);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [showRatingBar, setShowRatingBar] = useState(false);
  const [liked, setLiked] = useState(false);
  const [checked, setChecked] = useState(false);
  const [hearted, setHearted] = useState(false);
  const [flagged, setFlagged] = useState(false);
  const [commentText, setCommentText] = useState("");
  const editorInstanceRef = useRef<Editor | null>(null);
  const topLevelComments = getCommentsByPost(post.id);

  const displayTitle = post.title || post.content;

  if (!isExpanded) {
    return (
      <button
        onClick={onToggleExpand}
        className="w-full flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors text-left"
      >
        <span className="text-lg font-bold text-primary w-8 shrink-0 text-right">{rank}.</span>
        <span className="flex-1 text-sm text-card-foreground truncate">{displayTitle}</span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
          <Star className="h-3 w-3 text-secondary fill-secondary" />
          {avg}
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
      </button>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="border rounded-xl bg-card p-5 space-y-4">
        <button onClick={onToggleExpand} className="flex items-start gap-3 w-full text-left">
          <span className="text-xl font-bold text-primary w-8 shrink-0 text-right">{rank}.</span>
          <h3 className="flex-1 text-base font-bold text-card-foreground leading-snug">{displayTitle}</h3>
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
        </button>
        <div className="px-11 py-4 text-center">
          <Lock className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            <Link to="/signup" className="text-primary underline">Sign up</Link>
            {" "}or{" "}
            <Link to="/login" className="text-primary underline">log in</Link>
            {" "}to view this content.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-xl bg-card p-5 space-y-4">
      {/* Header */}
      <button onClick={onToggleExpand} className="flex items-start gap-3 w-full text-left">
        <span className="text-xl font-bold text-primary w-8 shrink-0 text-right">{rank}.</span>
        <h3 className="flex-1 text-base font-bold text-card-foreground leading-snug">{displayTitle}</h3>
        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
      </button>

      {/* Long-form content body */}
      {post.title && post.content && (
        <div className="px-11">
          <div className="prose prose-sm max-w-none text-card-foreground/90 leading-relaxed whitespace-pre-line">
            {post.content}
          </div>
        </div>
      )}

      {/* Rating box */}
      <div className="px-11 space-y-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-1.5">
            <Star className="h-4 w-4 text-secondary fill-secondary" />
            <span className="text-sm font-semibold">Rank {avg}</span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setShowRatingBar(!showRatingBar); }}
            className="flex items-center gap-2 bg-muted/50 hover:bg-muted rounded-lg px-3 py-1.5 transition-colors"
          >
            <span className="text-xs text-muted-foreground">You</span>
            <span className="text-sm font-semibold">
              {userRating !== null ? userRating.toFixed(1) : "—"}
            </span>
          </button>
        </div>
        {showRatingBar && (
          <StarRatingBar value={userRating} onChange={setUserRating} />
        )}
      </div>

      {/* Meta info */}
      <div className="px-11 flex items-center gap-1 text-xs text-muted-foreground">
        <span>@{post.username} · Posted {getTimeAgo(post.createdAt)} · {post.commentCount} comments</span>
        <PostActionMenu />
      </div>

      {/* Interaction icons */}
      <div className="flex items-center gap-5 px-11">
        <button
          onClick={() => setLiked(!liked)}
          className={`flex items-center gap-1 text-sm transition-colors ${liked ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
        >
          <ThumbsUp className="h-4 w-4" />
          <span className="text-xs">{post.ratingCount + (liked ? 1 : 0)}</span>
        </button>
        <button
          onClick={() => setChecked(!checked)}
          className={`flex items-center gap-1 text-sm transition-colors ${checked ? "text-green-500" : "text-muted-foreground hover:text-foreground"}`}
        >
          <CheckCircle className="h-4 w-4" />
        </button>
        <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <MessageSquare className="h-4 w-4" />
          <span className="text-xs">{post.commentCount}</span>
        </button>
        <button
          onClick={() => setHearted(!hearted)}
          className={`flex items-center gap-1 text-sm transition-colors ${hearted ? "text-red-500" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Heart className={`h-4 w-4 ${hearted ? "fill-red-500" : ""}`} />
        </button>
        <button
          onClick={() => setFlagged(!flagged)}
          className={`flex items-center gap-1 text-sm transition-colors ${flagged ? "text-orange-500" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Flag className="h-4 w-4" />
        </button>
      </div>

      {/* Comment input */}
      <div className="px-11 flex gap-2">
        <RichTextEditor
          placeholder="Add a comment..."
          onUpdate={(html) => setCommentText(html)}
          editorRef={(editor) => { editorInstanceRef.current = editor; }}
        />
        <button
          className="self-end p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
          onClick={() => {
            setCommentText("");
            editorInstanceRef.current?.commands.clearContent();
          }}
        >
          <Send className="h-4 w-4" />
        </button>
      </div>

      {/* Comments list */}
      {topLevelComments.length > 0 && (
        <div className="px-11 border-t pt-4">
          <h4 className="text-sm font-semibold text-muted-foreground mb-2">Comments</h4>
          <div className="divide-y">
            {topLevelComments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TopicPostExpanded;
