import { useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Send } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Editor } from "@tiptap/react";
import RichTextEditor from "@/components/RichTextEditor";
import CommentItem, { type DisplayComment } from "@/components/CommentItem";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface CommentsSectionProps {
  postId: string;
  isAuthenticated: boolean;
}

interface DbComment {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
}

const fetchComments = async (postId: string): Promise<DisplayComment[]> => {
  const { data, error } = await supabase
    .from("comments")
    .select("id, content, created_at, author_id")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  const rows = (data ?? []) as DbComment[];
  if (rows.length === 0) return [];

  const authorIds = Array.from(new Set(rows.map((r) => r.author_id)));
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, username")
    .in("id", authorIds);
  if (profilesError) throw profilesError;

  const usernameById = new Map<string, string>();
  for (const p of profiles ?? []) {
    usernameById.set(p.id, p.username || "anonymous");
  }

  return rows.map((c) => ({
    id: c.id,
    username: usernameById.get(c.author_id) || "anonymous",
    content: c.content,
    createdAt: new Date(c.created_at),
  }));
};

const CommentsSection = ({ postId, isAuthenticated }: CommentsSectionProps) => {
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  const nextUrl = encodeURIComponent(`${location.pathname}${location.search}#discussion`);
  const [commentText, setCommentText] = useState("");
  const editorInstanceRef = useRef<Editor | null>(null);

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["comments", postId],
    queryFn: () => fetchComments(postId),
    enabled: !!postId,
  });

  const createMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("comments").insert({
        post_id: postId,
        author_id: user.id,
        content,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      setCommentText("");
      editorInstanceRef.current?.commands.clearContent();
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Failed to post comment";
      toast({ title: "Could not post comment", description: message, variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    const trimmed = commentText.replace(/<[^>]*>/g, "").trim();
    if (!trimmed) return;
    createMutation.mutate(commentText);
  };

  return (
    <section
      id="discussion"
      className="space-y-[var(--space-rhythm-block)]"
      style={{ maxWidth: "var(--reading-max-width)" }}
      aria-labelledby="discussion-heading"
    >
      <h2
        id="discussion-heading"
        className="font-heading font-bold text-card-foreground"
        style={{
          fontSize: "var(--font-size-section-heading)",
          lineHeight: "var(--line-height-section-heading)",
        }}
      >
        Discussion ({isLoading ? "…" : comments.length})
      </h2>

      {isAuthenticated ? (
        <div
          className="flex gap-2 border-b pb-[var(--space-rhythm-block)]"
          style={{ borderColor: "hsl(var(--border-prose-divider))" }}
        >
          <RichTextEditor
            placeholder="Share your thoughts on this answer…"
            onUpdate={(html) => setCommentText(html)}
            editorRef={(editor) => {
              editorInstanceRef.current = editor;
            }}
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={
              !commentText.replace(/<[^>]*>/g, "").trim() || createMutation.isPending
            }
            className="self-end p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
            aria-label="Post comment"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          className="border-b pb-[var(--space-rhythm-block)]"
          style={{ borderColor: "hsl(var(--border-prose-divider))" }}
        >
          <Link
            to={`/login?next=${nextUrl}`}
            className="text-primary font-medium hover:underline text-sm"
          >
            Sign in to join the discussion →
          </Link>
        </div>
      )}

      {isLoading ? (
        <p className="text-muted-foreground text-sm italic">Loading discussion…</p>
      ) : comments.length === 0 ? (
        <p className="text-muted-foreground text-sm italic">
          No comments yet. Be the first to discuss this answer.
        </p>
      ) : (
        <div className="space-y-[var(--space-rhythm-tight)]">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      )}
    </section>
  );
};

export default CommentsSection;
