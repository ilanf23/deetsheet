import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, parseISO } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";
import AdminSortSelect from "@/components/admin/AdminSortSelect";
import AdminEditPostDialog from "@/components/admin/AdminEditPostDialog";
import AdminPostReviewDialog from "@/components/admin/AdminPostReviewDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { logAdminAction } from "@/lib/auditLog";

type Post = Tables<"posts">;
type Profile = Tables<"profiles">;

type PostTab = "pending" | "published" | "reported" | "rejected" | "deleted";
type SortKey =
  | "newest"
  | "oldest"
  | "title_asc"
  | "title_desc"
  | "author_asc"
  | "author_desc";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Submitted — Newest" },
  { value: "oldest", label: "Submitted — Oldest" },
  { value: "title_asc", label: "Title — A to Z" },
  { value: "title_desc", label: "Title — Z to A" },
  { value: "author_asc", label: "Author — A to Z" },
  { value: "author_desc", label: "Author — Z to A" },
];

const PAGE_SIZE = 12;

function StatusPill({ status }: { status: PostTab }) {
  const palette: Record<PostTab, { bg: string; fg: string; label: string }> = {
    pending: {
      bg: "hsl(var(--admin-warning-soft))",
      fg: "hsl(var(--admin-warning))",
      label: "Pending",
    },
    published: {
      bg: "hsl(var(--admin-success-soft))",
      fg: "hsl(var(--admin-success))",
      label: "Published",
    },
    reported: {
      bg: "hsl(var(--admin-danger-soft))",
      fg: "hsl(var(--admin-danger))",
      label: "Reported",
    },
    rejected: {
      bg: "hsl(var(--admin-danger-soft))",
      fg: "hsl(var(--admin-danger))",
      label: "Rejected",
    },
    deleted: {
      bg: "hsl(var(--admin-info-soft))",
      fg: "hsl(var(--admin-info))",
      label: "Deleted",
    },
  };
  const p = palette[status];
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded text-[12px]"
      style={{ backgroundColor: p.bg, color: p.fg }}
    >
      {p.label}
    </span>
  );
}

export default function AdminPosts() {
  const [tab, setTab] = useState<PostTab>("pending");
  const [posts, setPosts] = useState<Post[]>([]);
  const [authors, setAuthors] = useState<Map<string, Profile>>(new Map());
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortKey>("newest");
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [reviewPostId, setReviewPostId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [deletingPost, setDeletingPost] = useState<Post | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      // Only pull columns the table actually displays. The full `posts` row
      // includes rich-text body content which is expensive over the wire.
      const [postsRes, profilesRes, reportsRes] = await Promise.all([
        supabase
          .from("posts")
          .select("id, title, author_id, created_at, status")
          .order("created_at", { ascending: false }),
        supabase.from("profiles").select("id, name, username, avatar_url"),
        supabase.from("reports").select("post_id"),
      ]);
      setPosts((postsRes.data ?? []) as Post[]);
      const map = new Map<string, Profile>();
      (profilesRes.data ?? []).forEach((p) => map.set(p.id, p as Profile));
      setAuthors(map);
      const ids = new Set<string>();
      (reportsRes.data ?? []).forEach((r: any) => {
        if (r.post_id) ids.add(r.post_id);
      });
      setReportedIds(ids);
      setLoading(false);
    };
    fetchAll();
  }, [refreshKey]);

  const visiblePosts = useMemo(() => {
    let rows: Post[];
    if (tab === "pending") rows = posts.filter((p) => p.status === "pending");
    else if (tab === "rejected") rows = posts.filter((p) => p.status === "rejected");
    else if (tab === "deleted") rows = [];
    else if (tab === "reported") rows = posts.filter((p) => reportedIds.has(p.id));
    else rows = posts.filter((p) => p.status === "approved");

    const cmpStr = (a: string, b: string) =>
      a.localeCompare(b, undefined, { sensitivity: "base" });
    const cmpDate = (a?: string | null, b?: string | null) =>
      new Date(a ?? 0).getTime() - new Date(b ?? 0).getTime();
    const authorLabel = (p: Post) => {
      const a = authors.get(p.author_id);
      return (a?.name ?? a?.username ?? "").toLowerCase();
    };

    const sorted = [...rows];
    switch (sort) {
      case "newest":
        sorted.sort((a, b) => cmpDate(b.created_at, a.created_at));
        break;
      case "oldest":
        sorted.sort((a, b) => cmpDate(a.created_at, b.created_at));
        break;
      case "title_asc":
        sorted.sort((a, b) => cmpStr(a.title ?? "", b.title ?? ""));
        break;
      case "title_desc":
        sorted.sort((a, b) => cmpStr(b.title ?? "", a.title ?? ""));
        break;
      case "author_asc":
        sorted.sort((a, b) => cmpStr(authorLabel(a), authorLabel(b)));
        break;
      case "author_desc":
        sorted.sort((a, b) => cmpStr(authorLabel(b), authorLabel(a)));
        break;
    }
    return sorted;
  }, [posts, reportedIds, tab, sort, authors]);

  const tabCounts = {
    pending: posts.filter((p) => p.status === "pending").length,
    published: posts.filter((p) => p.status === "approved").length,
    reported: posts.filter((p) => reportedIds.has(p.id)).length,
    rejected: posts.filter((p) => p.status === "rejected").length,
    deleted: 0,
  };

  const total = visiblePosts.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageRows = visiblePosts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const visibleStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const visibleEnd = Math.min(page * PAGE_SIZE, total);

  const updateStatus = async (id: string, status: "approved" | "rejected") => {
    const { error } = await supabase.from("posts").update({ status }).eq("id", id);
    if (error) {
      toast({ title: `Error ${status === "approved" ? "approving" : "rejecting"} post`, description: error.message, variant: "destructive" });
      return;
    }
    setPosts((prev) => prev.map((p) => (p.id === id ? ({ ...p, status } as Post) : p)));
    if (user) {
      await logAdminAction({
        actorId: user.id,
        action: status === "approved" ? "post.approve" : "post.reject",
        entityType: "post",
        entityId: id,
      });
    }
    toast({
      title: status === "approved" ? "Post approved" : "Post rejected",
      variant: status === "rejected" ? "destructive" : undefined,
    });
  };
  const handleApprove = (id: string) => updateStatus(id, "approved");
  const handleReject = (id: string) => updateStatus(id, "rejected");

  const handleDelete = async (post: Post) => {
    const { error } = await supabase.from("posts").delete().eq("id", post.id);
    if (error) {
      toast({ title: "Error deleting post", description: error.message, variant: "destructive" });
      return;
    }
    setPosts((prev) => prev.filter((p) => p.id !== post.id));
    setReportedIds((prev) => {
      if (!prev.has(post.id)) return prev;
      const next = new Set(prev);
      next.delete(post.id);
      return next;
    });
    if (user) {
      await logAdminAction({
        actorId: user.id,
        action: "post.delete",
        entityType: "post",
        entityId: post.id,
        details: { title: post.title, authorId: post.author_id },
      });
    }
    toast({ title: "Post deleted", variant: "destructive" });
    setDeletingPost(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div
          className="h-7 w-7 rounded-full animate-spin border-2"
          style={{ borderColor: "hsl(var(--admin-primary))", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <h1
          className="text-[40px] font-bold leading-none tracking-tight"
          style={{ color: "hsl(var(--admin-fg))" }}
        >
          Posts
        </h1>
        <span className="text-[13px] mt-3" style={{ color: "hsl(var(--admin-fg-muted))" }}>
          {posts.length.toLocaleString()} total posts
        </span>
      </div>

      <div
        className="inline-flex items-center gap-1 p-1 rounded-full"
        style={{ backgroundColor: "hsl(var(--admin-primary-soft))" }}
      >
        {(["pending", "published", "reported", "rejected", "deleted"] as PostTab[]).map((t) => {
          const isActive = tab === t;
          return (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                setPage(1);
              }}
              className="px-4 py-1.5 rounded-full text-[13px] capitalize"
              style={{
                backgroundColor: isActive ? "hsl(var(--admin-surface))" : "transparent",
                color: isActive ? "hsl(var(--admin-fg))" : "hsl(var(--admin-fg-muted))",
                fontWeight: isActive ? 600 : 400,
                boxShadow: isActive ? "0 1px 2px rgba(0,0,0,0.04)" : "none",
              }}
            >
              {t}
              {tabCounts[t] > 0 ? ` (${tabCounts[t]})` : ""}
            </button>
          );
        })}
      </div>

      <div className="flex items-end gap-4">
        <AdminSortSelect
          label="Sort by"
          value={sort}
          onChange={(v) => {
            setSort(v);
            setPage(1);
          }}
          options={SORT_OPTIONS}
        />
      </div>

      <div
        className="rounded-xl overflow-hidden shadow-sm"
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid hsl(var(--admin-border))",
        }}
      >
        <div
          className="grid grid-cols-[3fr_1fr_1fr_1fr_1fr] bg-slate-50 px-6 py-3 text-[11px] font-semibold uppercase tracking-wide"
          style={{
            color: "rgb(100 116 139)",
            borderBottom: "1px solid hsl(var(--admin-border))",
          }}
        >
          <span>Title</span>
          <span>Author</span>
          <span>Status</span>
          <span>Submitted</span>
          <span className="text-right">Actions</span>
        </div>

        {pageRows.length === 0 ? (
          <div
            className="px-6 py-16 text-center text-[14px]"
            style={{ color: "hsl(var(--admin-fg-muted))" }}
          >
            {`No ${tab} posts.`}
          </div>
        ) : (
          pageRows.map((p) => {
            const author = authors.get(p.author_id);
            return (
              <div
                key={p.id}
                role="button"
                tabIndex={0}
                onClick={() => setReviewPostId(p.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setReviewPostId(p.id);
                  }
                }}
                className="grid grid-cols-[3fr_1fr_1fr_1fr_1fr] items-center bg-white px-6 py-4 text-[14px] transition-colors hover:bg-slate-50/80 cursor-pointer"
                style={{ borderBottom: "1px solid hsl(var(--admin-border))" }}
              >
                <span className="truncate font-medium text-slate-900">{p.title}</span>
                <span className="truncate text-slate-600">
                  {author?.name ?? author?.username ?? "Unknown"}
                </span>
                <span>
                  <StatusPill status={tab === "reported" ? "reported" : ((p.status === "approved" ? "published" : (p.status as PostTab)) ?? "published")} />
                </span>
                <span className="text-slate-600">
                  {formatDistanceToNow(parseISO(p.created_at))} ago
                </span>
                <span
                  className="flex items-center justify-end gap-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => setEditingPostId(p.id)}
                    className="text-slate-600 hover:text-slate-900"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleApprove(p.id)}
                    style={{ color: "hsl(var(--admin-primary))" }}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(p.id)}
                    style={{ color: "hsl(var(--admin-danger))" }}
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => setDeletingPost(p)}
                    style={{ color: "hsl(var(--admin-danger))" }}
                  >
                    Delete
                  </button>
                </span>
              </div>
            );
          })
        )}

        <div
          className="flex items-center justify-between px-6 py-4 text-[13px]"
          style={{ color: "hsl(var(--admin-fg-muted))" }}
        >
          <span>
            Showing {visibleStart}–{visibleEnd} of {total} {tab} posts
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                color: page === 1 ? "hsl(var(--admin-fg-subtle))" : "hsl(var(--admin-primary))",
              }}
            >
              ← Prev
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className="px-1"
                style={{
                  color: page === i + 1 ? "hsl(var(--admin-fg))" : "hsl(var(--admin-fg-muted))",
                  fontWeight: page === i + 1 ? 600 : 400,
                }}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                color:
                  page === totalPages
                    ? "hsl(var(--admin-fg-subtle))"
                    : "hsl(var(--admin-primary))",
              }}
            >
              Next →
            </button>
          </div>
        </div>
      </div>
      <AdminEditPostDialog
        postId={editingPostId}
        open={!!editingPostId}
        onOpenChange={(o) => { if (!o) setEditingPostId(null); }}
        onSaved={() => setRefreshKey((k) => k + 1)}
      />
      <AdminPostReviewDialog
        postId={reviewPostId}
        open={!!reviewPostId}
        onOpenChange={(o) => { if (!o) setReviewPostId(null); }}
        onApprove={handleApprove}
        onReject={handleReject}
      />
      <AlertDialog
        open={!!deletingPost}
        onOpenChange={(o) => { if (!o) setDeletingPost(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete post?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete
              {deletingPost ? ` "${deletingPost.title}"` : " this post"} and any
              comments on it. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingPost && handleDelete(deletingPost)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
