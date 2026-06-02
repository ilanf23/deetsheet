import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import CommentItem, {
  type CommentNode,
  type DisplayComment,
} from "@/components/CommentItem";
import { supabase } from "@/integrations/supabase/client";
import { sortByHotScore } from "@/lib/commentRanking";

interface CommentsSectionProps {
  postId: string;
}

interface DbComment {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  parent_comment_id: string | null;
  like_count: number | null;
  is_anonymous: boolean | null;
}

interface DbProfile {
  id: string;
  username: string | null;
  avatar_url: string | null;
}

const fetchComments = async (postId: string): Promise<DisplayComment[]> => {
  const { data, error } = await supabase
    .from("comments")
    .select("id, content, created_at, author_id, parent_comment_id, like_count, is_anonymous")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  const rows = (data ?? []) as unknown as DbComment[];
  if (rows.length === 0) return [];

  const authorIds = Array.from(new Set(rows.map((r) => r.author_id)));
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .in("id", authorIds);
  if (profilesError) throw profilesError;

  const profileByAuthorId = new Map<string, DbProfile>();
  for (const p of (profiles ?? []) as DbProfile[]) {
    profileByAuthorId.set(p.id, p);
  }

  const authorIdByCommentId = new Map<string, string>();
  for (const r of rows) authorIdByCommentId.set(r.id, r.author_id);

  return rows.map((c) => {
    const parentAuthorId = c.parent_comment_id
      ? authorIdByCommentId.get(c.parent_comment_id) ?? null
      : null;
    const isAnon = !!c.is_anonymous;
    const parentRow = c.parent_comment_id
      ? rows.find((r) => r.id === c.parent_comment_id)
      : null;
    const parentIsAnon = !!parentRow?.is_anonymous;
    return {
      id: c.id,
      username: isAnon
        ? "anonymous"
        : profileByAuthorId.get(c.author_id)?.username || "anonymous",
      avatarUrl: isAnon ? null : profileByAuthorId.get(c.author_id)?.avatar_url ?? null,
      content: c.content,
      createdAt: new Date(c.created_at),
      likeCount: c.like_count ?? 0,
      parentCommentId: c.parent_comment_id,
      parentUsername:
        parentAuthorId && !parentIsAnon
          ? profileByAuthorId.get(parentAuthorId)?.username ?? null
          : parentIsAnon
            ? "anonymous"
            : null,
      isAnonymous: isAnon,
    };
  });
};

const buildTree = (comments: DisplayComment[]): CommentNode[] => {
  const byId = new Map<string, CommentNode>();
  const roots: CommentNode[] = [];
  for (const c of comments) {
    byId.set(c.id, { ...c, children: [], descendantCount: 0 });
  }
  for (const node of byId.values()) {
    if (node.parentCommentId && byId.has(node.parentCommentId)) {
      byId.get(node.parentCommentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  const countDescendants = (n: CommentNode): number => {
    let count = n.children.length;
    for (const c of n.children) count += countDescendants(c);
    n.descendantCount = count;
    return count;
  };
  for (const root of roots) countDescendants(root);
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

  const tree = useMemo(() => {
    const nowMs = Date.now();
    return sortByHotScore(buildTree(comments), nowMs);
  }, [comments]);
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["comments", postId] });

  const handleReplySubmitted = () => {
    setOpenReplyId(null);
    invalidate();
  };

  return (
    <section
      id="discussion"
      aria-label={`Discussion (${comments.length})`}
    >
      {isLoading ? (
        <p className="text-muted-foreground text-sm italic">Loading discussion…</p>
      ) : tree.length === 0 ? (
        <p className="text-muted-foreground text-sm italic">
          Please add a comment or story to this post.
        </p>
      ) : (
        <div>
          {tree.map((node) => (
            <CommentItem
              key={node.id}
              node={node}
              postId={postId}
              depth={0}
              openReplyId={openReplyId}
              onReplyToggle={setOpenReplyId}
              onReplySubmitted={handleReplySubmitted}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default CommentsSection;
