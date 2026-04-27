import { useQuery } from "@tanstack/react-query";
import CommentItem, { type DisplayComment } from "@/components/CommentItem";
import { supabase } from "@/integrations/supabase/client";

interface CommentsSectionProps {
  postId: string;
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

const CommentsSection = ({ postId }: CommentsSectionProps) => {
  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["comments", postId],
    queryFn: () => fetchComments(postId),
    enabled: !!postId,
  });

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
