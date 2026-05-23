import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, parseISO } from "date-fns";
import AdminSortSelect from "@/components/admin/AdminSortSelect";
import AdminEditPostDialog from "@/components/admin/AdminEditPostDialog";
import { Hash, FileText, ChevronDown, ChevronRight } from "lucide-react";

type PriorPost = {
  id: string;
  title: string;
  status: string;
  created_at: string;
  topic_id: string;
  topic_name?: string | null;
};

function AuthorPriorPosts({ authorId, excludePostId }: { authorId: string; excludePostId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [posts, setPosts] = useState<PriorPost[]>([]);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && !loaded) {
      setLoading(true);
      const { data } = await supabase
        .from("posts")
        .select("id, title, status, created_at, topic_id")
        .eq("author_id", authorId)
        .neq("id", excludePostId)
        .order("created_at", { ascending: false })
        .limit(25);
      const rows = (data ?? []) as PriorPost[];
      const topicIds = Array.from(new Set(rows.map((r) => r.topic_id).filter(Boolean)));
      if (topicIds.length > 0) {
        const { data: tdata } = await supabase.from("topics").select("id, name").in("id", topicIds);
        const tmap = new Map<string, string>();
        (tdata ?? []).forEach((t: any) => tmap.set(t.id, t.name));
        rows.forEach((r) => (r.topic_name = tmap.get(r.topic_id) ?? null));
      }
      setPosts(rows);
      setLoaded(true);
      setLoading(false);
    }
  };

  return (
    <div className="mt-3 pt-3 border-t" style={{ borderColor: "hsl(var(--admin-border))" }}>
      <button
        type="button"
        onClick={toggle}
        className="inline-flex items-center gap-1.5 text-[12px] font-medium"
        style={{ color: "hsl(var(--admin-fg-muted))" }}
      >
        {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        {open ? "Hide" : "Show"} this user's prior posts
      </button>
      {open && (
        <div className="mt-2 pl-5">
          {loading ? (
            <div className="text-[12px]" style={{ color: "hsl(var(--admin-fg-muted))" }}>Loading…</div>
          ) : posts.length === 0 ? (
            <div className="text-[12px]" style={{ color: "hsl(var(--admin-fg-muted))" }}>No other posts by this user.</div>
          ) : (
            <ul className="space-y-1.5">
              {posts.map((p) => (
                <li key={p.id} className="text-[13px] flex items-center gap-2 flex-wrap">
                  <Link
                    to={p.topic_name ? `/topic/${p.topic_name}` : "#"}
                    className="hover:underline"
                    style={{ color: "hsl(var(--admin-primary))" }}
                  >
                    {p.title}
                  </Link>
                  <span className="text-[11px]" style={{ color: "hsl(var(--admin-fg-muted))" }}>
                    {p.status} · {formatDistanceToNow(parseISO(p.created_at))} ago
                    {p.topic_name ? ` · in ${p.topic_name}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

type Author = { id: string; name: string | null; username: string | null; avatar_url: string | null };

type PendingTopic = {
  kind: "topic";
  id: string;
  created_at: string;
  author?: Author;
  name: string;
  category_name: string;
  description: string | null;
};

type PendingPost = {
  kind: "post";
  id: string;
  created_at: string;
  author?: Author;
  title: string;
  content: string;
  image_url: string | null;
  topic_id: string;
  topic_name?: string;
};

type PendingItem = PendingTopic | PendingPost;
type FilterTab = "all" | "topics" | "posts";
type SortKey = "newest" | "oldest";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Submitted — Newest" },
  { value: "oldest", label: "Submitted — Oldest" },
];

function stripHtml(html: string, max = 220) {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text.length > max ? text.slice(0, max).trimEnd() + "…" : text;
}

function TypeBadge({ kind }: { kind: "topic" | "post" }) {
  const isTopic = kind === "topic";
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[12px] font-medium"
      style={{
        backgroundColor: isTopic ? "hsl(var(--admin-info-soft))" : "hsl(var(--admin-primary-soft))",
        color: isTopic ? "hsl(var(--admin-info))" : "hsl(var(--admin-primary))",
      }}
    >
      {isTopic ? <Hash className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
      {isTopic ? "Topic" : "Post"}
    </span>
  );
}

export default function AdminReview() {
  const [items, setItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<FilterTab>("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchAll = async () => {
    setLoading(true);
    const [topicsRes, postsRes] = await Promise.all([
      supabase
        .from("topics")
        .select("id, name, category_name, description, created_at, created_by")
        .eq("status", "pending"),
      supabase
        .from("posts")
        .select("id, title, content, image_url, topic_id, author_id, created_at")
        .eq("status", "pending"),
    ]);

    const topicRows = topicsRes.data ?? [];
    const postRows = postsRes.data ?? [];

    const authorIds = new Set<string>();
    topicRows.forEach((t: any) => t.created_by && authorIds.add(t.created_by));
    postRows.forEach((p: any) => p.author_id && authorIds.add(p.author_id));

    const topicIds = new Set<string>();
    postRows.forEach((p: any) => p.topic_id && topicIds.add(p.topic_id));

    const [profilesRes, parentTopicsRes] = await Promise.all([
      authorIds.size > 0
        ? supabase
            .from("profiles")
            .select("id, name, username, avatar_url")
            .in("id", Array.from(authorIds))
        : Promise.resolve({ data: [] }),
      topicIds.size > 0
        ? supabase.from("topics").select("id, name").in("id", Array.from(topicIds))
        : Promise.resolve({ data: [] }),
    ]);

    const authorMap = new Map<string, Author>();
    (profilesRes.data ?? []).forEach((p: any) => authorMap.set(p.id, p as Author));
    const topicMap = new Map<string, { name: string }>();
    (parentTopicsRes.data ?? []).forEach((t: any) =>
      topicMap.set(t.id, { name: t.name }),
    );

    const merged: PendingItem[] = [
      ...topicRows.map(
        (t: any): PendingTopic => ({
          kind: "topic",
          id: t.id,
          created_at: t.created_at,
          author: t.created_by ? authorMap.get(t.created_by) : undefined,
          name: t.name,
          category_name: t.category_name,
          description: t.description,
        }),
      ),
      ...postRows.map((p: any): PendingPost => {
        const parent = topicMap.get(p.topic_id);
        return {
          kind: "post",
          id: p.id,
          created_at: p.created_at,
          author: p.author_id ? authorMap.get(p.author_id) : undefined,
          title: p.title,
          content: p.content,
          image_url: p.image_url,
          topic_id: p.topic_id,
          topic_name: parent?.name,
        };
      }),
    ];

    setItems(merged);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const visible = useMemo(() => {
    let rows = items;
    if (tab === "topics") rows = rows.filter((i) => i.kind === "topic");
    if (tab === "posts") rows = rows.filter((i) => i.kind === "post");
    const sorted = [...rows];
    sorted.sort((a, b) => {
      const ad = new Date(a.created_at).getTime();
      const bd = new Date(b.created_at).getTime();
      return sort === "newest" ? bd - ad : ad - bd;
    });
    return sorted;
  }, [items, tab, sort]);

  const counts = useMemo(
    () => ({
      all: items.length,
      topics: items.filter((i) => i.kind === "topic").length,
      posts: items.filter((i) => i.kind === "post").length,
    }),
    [items],
  );

  const decide = async (item: PendingItem, status: "approved" | "rejected") => {
    const table = item.kind === "topic" ? "topics" : "posts";
    const { error } = await supabase.from(table).update({ status }).eq("id", item.id);
    if (error) {
      toast({
        title: `Error ${status === "approved" ? "approving" : "rejecting"} ${item.kind}`,
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    setItems((prev) => prev.filter((i) => !(i.kind === item.kind && i.id === item.id)));
    toast({
      title: status === "approved"
        ? `${item.kind === "topic" ? "Topic" : "Post"} approved`
        : `${item.kind === "topic" ? "Topic" : "Post"} rejected`,
      variant: status === "rejected" ? "destructive" : undefined,
    });
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
          Review queue
        </h1>
        <span className="text-[13px] mt-3" style={{ color: "hsl(var(--admin-fg-muted))" }}>
          {counts.all.toLocaleString()} pending
        </span>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div
          className="inline-flex items-center gap-1 p-1 rounded-full"
          style={{ backgroundColor: "hsl(var(--admin-primary-soft))" }}
        >
          {(
            [
              ["all", `All (${counts.all})`],
              ["topics", `Topics (${counts.topics})`],
              ["posts", `Posts (${counts.posts})`],
            ] as [FilterTab, string][]
          ).map(([key, label]) => {
            const isActive = tab === key;
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className="px-4 py-1.5 rounded-full text-[13px]"
                style={{
                  backgroundColor: isActive ? "hsl(var(--admin-surface))" : "transparent",
                  color: isActive ? "hsl(var(--admin-fg))" : "hsl(var(--admin-fg-muted))",
                  fontWeight: isActive ? 600 : 400,
                  boxShadow: isActive ? "0 1px 2px rgba(0,0,0,0.04)" : "none",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        <AdminSortSelect label="Sort by" value={sort} onChange={(v) => setSort(v as SortKey)} options={SORT_OPTIONS} />
      </div>

      {visible.length === 0 ? (
        <div
          className="rounded-xl px-6 py-20 text-center text-[14px]"
          style={{
            backgroundColor: "hsl(var(--admin-surface))",
            border: "1px solid hsl(var(--admin-border))",
            color: "hsl(var(--admin-fg-muted))",
          }}
        >
          Inbox zero — nothing waiting for review.
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((item) => {
            const author = item.author;
            const authorLabel = author?.name ?? author?.username ?? "Unknown";
            return (
              <div
                key={`${item.kind}-${item.id}`}
                className="rounded-xl p-5"
                style={{
                  backgroundColor: "hsl(var(--admin-surface))",
                  border: "1px solid hsl(var(--admin-border))",
                }}
              >
                <div className="flex gap-4">
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-3 text-[12px]" style={{ color: "hsl(var(--admin-fg-muted))" }}>
                    <TypeBadge kind={item.kind} />
                    <span>by {authorLabel}</span>
                    <span>·</span>
                    <span>{formatDistanceToNow(parseISO(item.created_at))} ago</span>
                  </div>

                  {item.kind === "topic" ? (
                    <>
                      <h3 className="text-[18px] font-semibold" style={{ color: "hsl(var(--admin-fg))" }}>
                        {item.name}
                      </h3>
                      <div className="text-[12px]" style={{ color: "hsl(var(--admin-fg-muted))" }}>
                        Category: {item.category_name}
                      </div>
                      {item.description && (
                        <p className="text-[14px]" style={{ color: "hsl(var(--admin-fg))" }}>
                          {stripHtml(item.description)}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <h3 className="text-[18px] font-semibold" style={{ color: "hsl(var(--admin-fg))" }}>
                        {item.title}
                      </h3>
                      {item.topic_name && (
                        <div className="text-[12px]" style={{ color: "hsl(var(--admin-fg-muted))" }}>
                          In topic:{" "}
                          <Link
                            to={`/topic/${item.topic_name}`}
                            style={{ color: "hsl(var(--admin-primary))" }}
                            className="hover:underline"
                          >
                            {item.topic_name}
                          </Link>
                        </div>
                      )}
                      <p className="text-[14px]" style={{ color: "hsl(var(--admin-fg))" }}>
                        {stripHtml(item.content)}
                      </p>
                    </>
                  )}
                </div>

                {item.kind === "post" && item.image_url && (
                  <img
                    src={item.image_url}
                    alt=""
                    className="w-32 h-32 object-cover rounded-lg shrink-0"
                    onError={(e) => {
                      const img = e.currentTarget as HTMLImageElement;
                      if (!img.src.endsWith("/placeholder.svg")) img.src = "/placeholder.svg";
                    }}
                  />
                )}

                <div className="flex flex-col gap-2 shrink-0 self-center">
                  <button
                    onClick={() => decide(item, "approved")}
                    className="px-4 py-2 rounded-md text-[13px] font-semibold"
                    style={{
                      backgroundColor: "hsl(var(--admin-primary))",
                      color: "#ffffff",
                    }}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => decide(item, "rejected")}
                    className="px-4 py-2 rounded-md text-[13px] font-semibold"
                    style={{
                      backgroundColor: "hsl(var(--admin-danger-soft))",
                      color: "hsl(var(--admin-danger))",
                    }}
                  >
                    Reject
                  </button>
                  {item.kind === "post" && (
                    <button
                      onClick={() => setEditingPostId(item.id)}
                      className="px-4 py-2 rounded-md text-[13px] font-semibold border"
                      style={{
                        borderColor: "hsl(var(--admin-border))",
                        color: "hsl(var(--admin-fg))",
                      }}
                    >
                      Edit
                    </button>
                  )}
                </div>
                </div>
                {item.kind === "post" && author?.id && (
                  <AuthorPriorPosts authorId={author.id} excludePostId={item.id} />
                )}
              </div>
            );
          })}
        </div>
      )}
      <AdminEditPostDialog
        postId={editingPostId}
        open={!!editingPostId}
        onOpenChange={(o) => { if (!o) setEditingPostId(null); }}
        onSaved={fetchAll}
      />
    </div>
  );
}
