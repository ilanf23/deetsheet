import { useState, useRef, useEffect, useCallback } from "react";
import { ThumbsUp, CheckCircle, MessageSquare, Heart, Flag, Send, ChevronDown, ChevronRight, Star, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Post, getTimeAgo, getCommentsByPost } from "@/data/seedData";
import CommentItem from "@/components/CommentItem";
import StarRatingBar from "@/components/StarRatingBar";
import RichTextEditor from "@/components/RichTextEditor";
import PostActionMenu from "@/components/PostActionMenu";
import UserAvatar from "@/components/UserAvatar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Editor } from "@tiptap/react";

interface TopicPostExpandedProps {
  post: Post;
  rank: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  isAuthenticated: boolean;
}

const TopicPostExpanded = ({ post, rank, isExpanded, onToggleExpand, isAuthenticated }: TopicPostExpandedProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  // Compute seed-data average as fallback
  const seedAvg = post.ratingCount > 0 ? Math.round((post.ratingScore / post.ratingCount) * 10) / 10 : 0;
  const [avg, setAvg] = useState<number>(seedAvg);
  const [ratingCount, setRatingCount] = useState<number>(post.ratingCount);
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

  // Try to fetch real DB ratings (will override seed data if found)
  const fetchRatingStats = useCallback(async () => {
    const { data } = await supabase
      .from("ratings")
      .select("value")
      .eq("post_id", post.id);
    if (data && data.length > 0) {
      const average = data.reduce((sum, r) => sum + Number(r.value), 0) / data.length;
      setAvg(Math.round(average * 10) / 10);
      setRatingCount(data.length);
    }
    // If no DB ratings, keep seed data values
  }, [post.id]);

  // Fetch current user's rating
  useEffect(() => {
    fetchRatingStats();
    if (user) {
      supabase
        .from("ratings")
        .select("value")
        .eq("post_id", post.id)
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setUserRating(Number(data.value));
        });
    }
  }, [post.id, user, fetchRatingStats]);

  // Submit or update rating
  const handleRatingChange = async (value: number) => {
    setUserRating(value);
    if (!user) return;
    const { error } = await supabase
      .from("ratings")
      .upsert(
        { user_id: user.id, post_id: post.id, value },
        { onConflict: "user_id,post_id" }
      );
    if (error) {
      toast({ title: "Rating failed", description: error.message, variant: "destructive" });
    } else {
      await fetchRatingStats();
    }
  };

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

        {/* Content tease with fade */}
        {post.content && (
          <div className="px-11">
            <div
              className="max-h-[4.5rem] overflow-hidden text-sm text-card-foreground/90 leading-relaxed whitespace-pre-line"
              style={{ maskImage: 'linear-gradient(to bottom, black 40%, transparent)', WebkitMaskImage: 'linear-gradient(to bottom, black 40%, transparent)' }}
            >
              {post.content}
            </div>
          </div>
        )}

        {/* Sign-in CTA */}
        <div className="mx-11 rounded-lg bg-accent/50 border border-primary/10 px-6 py-5 text-center space-y-3">
          <Lock className="h-5 w-5 text-primary mx-auto" />
          <p className="text-sm font-semibold text-card-foreground">Want the full deet?</p>
          <p className="text-xs text-muted-foreground">
            Create a free account to unlock all content, ratings, and comments.
          </p>
          <div className="flex items-center justify-center gap-3 pt-1">
            <Button asChild>
              <Link to="/signup">Sign Up Free</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/login">Log In</Link>
            </Button>
          </div>
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

      {/* Post image */}
      {post.imageUrl && (
        <div className="px-11">
          <img
            src={post.imageUrl}
            alt={displayTitle}
            className="w-full max-h-64 object-cover rounded-lg"
            loading="lazy"
          />
        </div>
      )}

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
            <span className="text-xs text-muted-foreground">({ratingCount})</span>
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
          <StarRatingBar value={userRating} onChange={handleRatingChange} />
        )}
        <UserAvatar username={post.username} size="sm" />
        <span>· Posted {getTimeAgo(post.createdAt)} · {post.commentCount} comments</span>
        <PostActionMenu postId={post.id} topicName={post.topicName} />
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
