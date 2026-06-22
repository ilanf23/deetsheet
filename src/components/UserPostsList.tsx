import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Star, MessageSquare, Loader2, Pencil, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { formatTitle } from "@/lib/formatTitle";
import { useAuth } from "@/contexts/AuthContext";
import EditPostDialog from "@/components/EditPostDialog";

interface UserPost {
  id: string;
  title: string;
  content: string;
  score: number;
  comment_count: number;
  created_at: string;
  status: string;
  is_anonymous?: boolean;
  topic: { name: string; slug: string } | null;
}

const STATUS_PILL: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending review", className: "bg-amber-100 text-amber-800" },
  approved: { label: "Live", className: "bg-green-100 text-green-800" },
  rejected: { label: "Rejected", className: "bg-red-100 text-red-800" },
};

const UserPostsList = ({ userId }: { userId: string }) => {
  const { user } = useAuth();
  const isOwnProfile = user?.id === userId;
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    let query = supabase
      .from("posts")
      .select("id, title, content, score, comment_count, created_at, status, is_anonymous, topics(name, slug)")
      .eq("author_id", userId)
      .order("created_at", { ascending: false });

    if (!isOwnProfile) {
      query = query.eq("status", "approved").eq("is_anonymous", false);
    }

    const { data, error } = await query;

    if (!error && data) {
      type Row = Omit<UserPost, "topic"> & {
        topics: { name: string; slug: string } | { name: string; slug: string }[] | null;
      };
      setPosts(
        (data as unknown as Row[]).map((p) => ({
          ...p,
          topic: Array.isArray(p.topics) ? (p.topics[0] ?? null) : p.topics,
        }))
      );
    }
    setLoading(false);
  }, [userId, isOwnProfile]);


  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        You haven't created any posts yet.
      </p>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {posts.map((post) => {
          const timeAgo = getTimeAgo(post.created_at);
          const pill = STATUS_PILL[post.status] ?? STATUS_PILL.approved;
          return (
            <Card key={post.id} className="bg-card hover:shadow-md transition-all duration-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <Link
                    to={post.topic ? `/topic/${post.topic.slug}` : "#"}
                    className="flex-1 min-w-0 group"
                  >
                    <h4 className="text-sm font-semibold text-primary group-hover:underline truncate flex items-center gap-2">
                      <span className="truncate">{formatTitle(post.title)}</span>
                      {post.status === "pending" && (
                        <span className="inline-flex items-center gap-1 shrink-0 text-secondary">
                          <Clock
                            className="h-[1em] w-[1em]"
                            strokeWidth={2.5}
                            aria-label="Pending review"
                          />
                          <span className="text-xs font-medium">Pending</span>
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-card-foreground mt-1 line-clamp-2">
                      {post.content}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                      {post.topic && (
                        <span className="text-primary font-medium">{post.topic.name}</span>
                      )}
                      <span>{timeAgo}</span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${pill.className}`}
                      >
                        {pill.label}
                      </span>
                      {post.is_anonymous && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-muted-foreground">
                          Anonymous
                        </span>
                      )}
                    </div>
                  </Link>
                  <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 text-secondary fill-secondary" />
                      {post.score}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5" />
                      {post.comment_count}
                    </span>
                    {isOwnProfile && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setEditingPostId(post.id);
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded border text-primary hover:bg-primary/5"
                        aria-label="Edit post"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <EditPostDialog
        postId={editingPostId}
        open={!!editingPostId}
        onOpenChange={(o) => {
          if (!o) setEditingPostId(null);
        }}
        onSaved={() => {
          setEditingPostId(null);
          fetchPosts();
        }}
      />
    </>
  );
};

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export default UserPostsList;
