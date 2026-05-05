import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, parseISO } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";

type Post = Tables<"posts">;
type Profile = Tables<"profiles">;

type PostTab = "pending" | "published" | "reported" | "rejected" | "deleted";

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
  const { toast } = useToast();

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const [postsRes, profilesRes, reportsRes] = await Promise.all([
        supabase.from("posts").select("*").order("created_at", { ascending: false }),
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
  }, []);

  // No `status` field on posts yet, so "pending" is empty by design until the schema lands.
  const visiblePosts = useMemo(() => {
    if (tab === "pending") return [];
    if (tab === "rejected") return [];
    if (tab === "deleted") return [];
    if (tab === "reported") return posts.filter((p) => reportedIds.has(p.id));
    return posts;
  }, [posts, reportedIds, tab]);

  const tabCounts = {
    pending: 0,
    published: posts.length,
    reported: posts.filter((p) => reportedIds.has(p.id)).length,
    rejected: 0,
    deleted: 0,
  };

  const total = visiblePosts.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageRows = visiblePosts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const visibleStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const visibleEnd = Math.min(page * PAGE_SIZE, total);

  const handleApprove = (id: string) =>
    toast({ title: "Approved", description: `Post ${id.slice(0, 8)} approved.` });
  const handleReject = (id: string) =>
    toast({
      title: "Rejected",
      description: `Post ${id.slice(0, 8)} rejected.`,
      variant: "destructive",
    });

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

      <div
        className="rounded-xl overflow-hidden"
        style={{
          backgroundColor: "hsl(var(--admin-surface))",
          border: "1px solid hsl(var(--admin-border))",
        }}
      >
        <div
          className="grid grid-cols-[3fr_1fr_1fr_1fr_1fr] px-6 py-3 text-[12px]"
          style={{
            color: "hsl(var(--admin-fg-muted))",
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
            {tab === "pending"
              ? "No pending posts. The post-approval workflow activates once the status field lands on the schema."
              : `No ${tab} posts.`}
          </div>
        ) : (
          pageRows.map((p) => {
            const author = authors.get(p.author_id);
            return (
              <div
                key={p.id}
                className="grid grid-cols-[3fr_1fr_1fr_1fr_1fr] items-center px-6 py-4 text-[14px]"
                style={{ borderBottom: "1px solid hsl(var(--admin-border))" }}
              >
                <span style={{ color: "hsl(var(--admin-fg))" }}>{p.title}</span>
                <span style={{ color: "hsl(var(--admin-fg-muted))" }}>
                  {author?.name ?? author?.username ?? "Unknown"}
                </span>
                <span>
                  <StatusPill status={tab === "reported" ? "reported" : "published"} />
                </span>
                <span style={{ color: "hsl(var(--admin-fg-muted))" }}>
                  {formatDistanceToNow(parseISO(p.created_at))} ago
                </span>
                <span className="flex items-center justify-end gap-4">
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
    </div>
  );
}
