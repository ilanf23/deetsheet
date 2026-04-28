import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  parent_comment_id: string | null;
}

type CommentNode = DisplayComment & { children: CommentNode[] };

const fetchComments = async (postId: string): Promise<DisplayComment[]> => {
  const { data, error } = await supabase
    .from("comments")
    .select("id, content, created_at, author_id, parent_comment_id")
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

  const usernameByAuthorId = new Map<string, string>();
  for (const p of profiles ?? []) {
    usernameByAuthorId.set(p.id, p.username || "anonymous");
  }

  const authorIdByCommentId = new Map<string, string>();
  for (const r of rows) authorIdByCommentId.set(r.id, r.author_id);

  return rows.map((c) => {
    const parentAuthorId = c.parent_comment_id
      ? authorIdByCommentId.get(c.parent_comment_id) ?? null
      : null;
    return {
      id: c.id,
      username: usernameByAuthorId.get(c.author_id) || "anonymous",
      content: c.content,
      createdAt: new Date(c.created_at),
      parentCommentId: c.parent_comment_id,
      parentUsername: parentAuthorId
        ? usernameByAuthorId.get(parentAuthorId) ?? null
        : null,
    };
  });
};

const buildTree = (comments: DisplayComment[]): CommentNode[] => {
  const byId = new Map<string, CommentNode>();
  const roots: CommentNode[] = [];
  for (const c of comments) byId.set(c.id, { ...c, children: [] });
  for (const node of byId.values()) {
    if (node.parentCommentId && byId.has(node.parentCommentId)) {
      byId.get(node.parentCommentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
};

const CommentsSection = ({ postId }: CommentsSectionProps) => {
  const queryClient = useQueryClient();
  const [openReplyId, setOpenReplyId] = useState<string | null>(null);

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["comments", postId],
    queryFn: () => fetchComments(postId),
    enabled: !!postId,
  });

  const tree = buildTree(comments);
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["comments", postId] });

  const handleReplySubmitted = () => {
    setOpenReplyId(null);
    invalidate();
  };

  const renderTree = (nodes: CommentNode[], depth: number) =>
    nodes.map((node) => (
      <CommentItem
        key={node.id}
        comment={node}
        postId={postId}
        depth={depth}
        isReplyOpen={openReplyId === node.id}
        onReplyToggle={setOpenReplyId}
        onReplySubmitted={handleReplySubmitted}
      >
        {node.children.length > 0 && renderTree(node.children, depth + 1)}
      </CommentItem>
    ));

  return (
    <section
      id="discussion"
      aria-label={`Discussion (${comments.length})`}
      style={{ maxWidth: "var(--reading-max-width)" }}
    >
      {isLoading ? (
        <p className="text-muted-foreground text-sm italic">Loading discussion…</p>
      ) : tree.length === 0 ? (
        <p className="text-muted-foreground text-sm italic">
          No comments yet. Be the first to discuss this answer.
        </p>
      ) : (
        <div>{renderTree(tree, 0)}</div>
      )}
    </section>
  );
};

export default CommentsSection;
