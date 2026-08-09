import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, parseISO, format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import AdminSortSelect from "@/components/admin/AdminSortSelect";
import ManageTemplatesDialog from "@/components/admin/ManageTemplatesDialog";
import { ChevronDown, FileText, PenSquare, Search } from "lucide-react";

type Thread = {
  id: string;
  user_id: string;
  post_id: string | null;
  subject: string;
  status: "open" | "needs_contact" | "resolved";
  last_message_at: string;
  last_sender: "admin" | "user";
  user_name?: string;
  user_username?: string;
  user_email?: string;
  post_title?: string | null;
  post_status?: string | null;
};

type FilterTab = "needs_contact" | "all";
type SortKey = "recent" | "oldest";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "recent", label: "Recently edited" },
  { value: "oldest", label: "Oldest" },
];

function StatusPill({ status, lastSender }: { status: string; lastSender: string }) {
  let label = "Open";
  let bg = "hsl(var(--admin-primary-soft))";
  let fg = "hsl(var(--admin-primary))";
  if (status === "needs_contact") {
    label = "Re-review";
    bg = "hsl(var(--admin-danger-soft))";
    fg = "hsl(var(--admin-danger))";
  } else if (status === "resolved") {
    label = "Resolved";
    bg = "hsl(var(--admin-info-soft))";
    fg = "hsl(var(--admin-info))";
  } else if (lastSender === "admin") {
    label = "Pending";
    bg = "hsl(var(--admin-warning-soft, 39 100% 92%))";
    fg = "hsl(var(--admin-warning, 30 90% 40%))";
  }
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium"
      style={{ backgroundColor: bg, color: fg }}
    >
      {label}
    </span>
  );
}

export default function AdminMessages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<FilterTab>("needs_contact");
  const [sort, setSort] = useState<SortKey>("recent");
  const [search, setSearch] = useState("");
  const [templatesOpen, setTemplatesOpen] = useState(false);

  // Compose state
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeCtx, setComposeCtx] = useState<{
    threadId?: string;
    userId: string;
    userLabel: string;
    postId: string | null;
    postTitle: string | null;
    postStatus: string | null;
  } | null>(null);
  const [subject, setSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [alsoEmail, setAlsoEmail] = useState(true);

  const [sending, setSending] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);

  // New-thread user picker
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const [pickerResults, setPickerResults] = useState<any[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    const { data: threadRows } = await supabase
      .from("message_threads")
      .select("id,user_id,post_id,subject,status,last_message_at,last_sender")
      .order("last_message_at", { ascending: false })
      .limit(200);
    const rows = (threadRows ?? []) as Thread[];

    const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
    const postIds = Array.from(new Set(rows.map((r) => r.post_id).filter(Boolean) as string[]));

    const [profRes, postsRes] = await Promise.all([
      userIds.length
        ? supabase.from("profiles").select("id,name,username").in("id", userIds)
        : Promise.resolve({ data: [] as any[] }),
      postIds.length
        ? supabase.from("posts").select("id,title,status").in("id", postIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);
    const pMap = new Map<string, any>();
    (profRes.data ?? []).forEach((p: any) => pMap.set(p.id, p));
    const postMap = new Map<string, any>();
    (postsRes.data ?? []).forEach((p: any) => postMap.set(p.id, p));

    rows.forEach((r) => {
      const p = pMap.get(r.user_id);
      r.user_name = p?.name ?? null;
      r.user_username = p?.username ?? null;
      if (r.post_id) {
        const post = postMap.get(r.post_id);
        r.post_title = post?.title ?? null;
        r.post_status = post?.status ?? null;
      }
    });

    setThreads(rows);
    setLoading(false);
  };

  const fetchTemplates = async () => {
    const { data } = await supabase
      .from("message_templates")
      .select("*")
      .order("title");
    setTemplates(data ?? []);
  };

  useEffect(() => {
    fetchAll();
    fetchTemplates();
  }, []);

  // Live user search for new-thread picker
  useEffect(() => {
    if (!pickerOpen) return;
    let cancelled = false;
    const run = async () => {
      setPickerLoading(true);
      const q = pickerQuery.trim();
      let query = supabase.from("profiles").select("id,name,username").limit(20);
      if (q) {
        query = query.or(`name.ilike.%${q}%,username.ilike.%${q}%`);
      } else {
        query = query.order("username", { ascending: true });
      }
      const { data } = await query;
      if (!cancelled) {
        setPickerResults(data ?? []);
        setPickerLoading(false);
      }
    };
    const t = setTimeout(run, 150);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [pickerOpen, pickerQuery]);

  const startNewThreadWith = (p: { id: string; name?: string | null; username?: string | null }) => {
    setPickerOpen(false);
    openCompose({
      userId: p.id,
      userLabel: p.name ?? p.username ?? p.id,
      postId: null,
      postTitle: null,
      postStatus: null,
    });
    setSubject("Message from DeetSheet");
  };

  // Deep-link compose from AdminReview
  useEffect(() => {
    const compose = searchParams.get("compose");
    const postId = searchParams.get("post");
    const userId = searchParams.get("user");
    if (compose && userId) {
      openCompose({
        userId,
        userLabel: userId,
        postId: postId,
        postTitle: null,
        postStatus: null,
      });
      // enrich labels
      (async () => {
        const [p, post] = await Promise.all([
          supabase.from("profiles").select("name,username").eq("id", userId).maybeSingle(),
          postId
            ? supabase.from("posts").select("title,status").eq("id", postId).maybeSingle()
            : Promise.resolve({ data: null }),
        ]);
        setComposeCtx((c) =>
          c
            ? {
                ...c,
                userLabel: p.data?.name ?? p.data?.username ?? userId,
                postTitle: (post as any).data?.title ?? null,
                postStatus: (post as any).data?.status ?? null,
              }
            : c
        );
        if ((post as any).data?.title) {
          setSubject(`Regarding your post: ${(post as any).data.title}`);
        }
      })();
      // clear params so re-mount doesn't re-open
      const next = new URLSearchParams(searchParams);
      next.delete("compose");
      next.delete("post");
      next.delete("user");
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCompose = (ctx: NonNullable<typeof composeCtx>) => {
    setComposeCtx(ctx);
    setSubject(ctx.postTitle ? `Regarding your post: ${ctx.postTitle}` : "Message from DeetSheet");
    setReason("");
    setSuggestions("");
    setDeadline("30 days to adjust, or the post is automatically deleted");
    setAlsoEmail(true);
    setComposeOpen(true);
  };

  const openComposeForThread = (t: Thread) => {
    openCompose({
      threadId: t.id,
      userId: t.user_id,
      userLabel: t.user_name ?? t.user_username ?? t.user_id,
      postId: t.post_id,
      postTitle: t.post_title ?? null,
      postStatus: t.post_status ?? null,
    });
    setSubject(t.subject);
  };

  const applyTemplate = (id: string) => {
    const t = templates.find((x) => x.id === id);
    if (!t) return;
    setSubject(t.subject ?? subject);
    if (t.reason_default) setReason(t.reason_default);
    if (t.suggestions_default) setSuggestions(t.suggestions_default);
    if (t.deadline_default) setDeadline(t.deadline_default);
  };

  const sendSlip = async () => {
    if (!composeCtx || !user) return;
    setSending(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const accessToken = sess.session?.access_token;
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-admin-message`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            thread_id: composeCtx.threadId,
            user_id: composeCtx.userId,
            post_id: composeCtx.postId,
            subject,
            slip: {
              status: composeCtx.postStatus
                ? `${composeCtx.postStatus === "pending" ? "Pending — not yet approved" : composeCtx.postStatus}`
                : undefined,
              post: composeCtx.postTitle ?? undefined,
              reason,
              suggestions,
              deadline_text: deadline,
            },
            send_email: alsoEmail,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to send");
      toast({ title: "Slip sent", description: alsoEmail ? "Delivered in-app and by email." : "Delivered in-app." });
      setComposeOpen(false);
      fetchAll();
    } catch (e: any) {
      toast({ title: "Send failed", description: e?.message ?? "Unknown error", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const filtered = useMemo(() => {
    let rows = threads;
    if (tab === "needs_contact") rows = rows.filter((r) => r.status === "needs_contact" || r.last_sender === "user");
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (r) =>
          (r.user_name ?? "").toLowerCase().includes(q) ||
          (r.user_username ?? "").toLowerCase().includes(q) ||
          (r.post_title ?? "").toLowerCase().includes(q) ||
          r.subject.toLowerCase().includes(q)
      );
    }
    const sorted = [...rows].sort((a, b) => {
      const ad = new Date(a.last_message_at).getTime();
      const bd = new Date(b.last_message_at).getTime();
      return sort === "recent" ? bd - ad : ad - bd;
    });
    return sorted;
  }, [threads, tab, sort, search]);

  const needsContactCount = threads.filter((t) => t.status === "needs_contact" || t.last_sender === "user").length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-[40px] font-bold leading-none tracking-tight" style={{ color: "hsl(var(--admin-fg))" }}>
          Messaging
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setPickerQuery("");
              setPickerResults([]);
              setPickerOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-semibold text-white"
            style={{ backgroundColor: "hsl(var(--admin-primary))" }}
          >
            <PenSquare className="h-3.5 w-3.5" />
            New message
          </button>
          <button
            onClick={() => setTemplatesOpen(true)}
            className="px-4 py-2 rounded-full text-[13px] font-medium border"
            style={{
              backgroundColor: "hsl(var(--admin-surface))",
              borderColor: "hsl(var(--admin-border))",
              color: "hsl(var(--admin-primary))",
            }}
          >
            Manage form letters
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Input
          placeholder="Search by user or post…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md rounded-full"
        />
        <div
          className="inline-flex items-center gap-1 p-1 rounded-full"
          style={{ backgroundColor: "hsl(var(--admin-primary-soft))" }}
        >
          {(
            [
              ["needs_contact", `Needs contact (${needsContactCount})`],
              ["all", "All"],
            ] as [FilterTab, string][]
          ).map(([key, label]) => {
            const active = tab === key;
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className="px-4 py-1.5 rounded-full text-[13px]"
                style={{
                  backgroundColor: active ? "hsl(var(--admin-primary))" : "transparent",
                  color: active ? "#fff" : "hsl(var(--admin-primary))",
                  fontWeight: active ? 600 : 500,
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
        <AdminSortSelect
          label="Sort by"
          value={sort}
          onChange={(v) => setSort(v as SortKey)}
          options={SORT_OPTIONS}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div
            className="h-7 w-7 rounded-full animate-spin border-2"
            style={{ borderColor: "hsl(var(--admin-primary))", borderTopColor: "transparent" }}
          />
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="rounded-xl px-6 py-20 text-center text-[14px]"
          style={{
            backgroundColor: "hsl(var(--admin-surface))",
            border: "1px solid hsl(var(--admin-border))",
            color: "hsl(var(--admin-fg-muted))",
          }}
        >
          No threads to show.
        </div>
      ) : (
        <div
          className="rounded-xl overflow-hidden"
          style={{
            backgroundColor: "hsl(var(--admin-surface))",
            border: "1px solid hsl(var(--admin-border))",
          }}
        >
          <div
            className="grid grid-cols-[1.2fr_1.6fr_0.8fr_1fr_0.7fr] gap-6 px-6 py-3 text-[12px] font-semibold uppercase tracking-wide"
            style={{
              color: "hsl(var(--admin-fg-muted))",
              borderBottom: "1px solid hsl(var(--admin-border))",
            }}
          >
            <div>User</div>
            <div>Post</div>
            <div>Status</div>
            <div>Last contact</div>
            <div className="text-right">Action</div>
          </div>
          {filtered.map((t, idx) => {
            const label = t.user_name ?? t.user_username ?? "Unknown";
            return (
              <div
                key={t.id}
                className="grid grid-cols-[1.2fr_1.6fr_0.8fr_1fr_0.7fr] gap-6 items-center px-6 py-4 text-[14px]"
                style={{
                  borderBottom:
                    idx === filtered.length - 1
                      ? "none"
                      : "1px solid hsl(var(--admin-border))",
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-[13px] font-semibold leading-none text-white"
                    style={{ backgroundColor: "hsl(var(--secondary))" }}
                  >
                    {label.slice(0, 1).toUpperCase()}
                  </div>
                  <Link to={`/profile/${t.user_id}`} className="truncate hover:underline" style={{ color: "hsl(var(--admin-primary))" }}>
                    {label}
                  </Link>
                </div>
                <div className="truncate" style={{ color: "hsl(var(--admin-fg))" }}>
                  {t.post_title ? `"${t.post_title}"` : t.subject}
                </div>
                <div>
                  <StatusPill status={t.status} lastSender={t.last_sender} />
                </div>
                <div style={{ color: "hsl(var(--admin-fg-muted))" }} className="text-[13px]">
                  {format(parseISO(t.last_message_at), "MMM d")} · {t.last_sender === "user" ? "replied" : "no reply"}
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => openComposeForThread(t)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-[13px] font-semibold"
                    style={{ color: "hsl(var(--admin-primary))" }}
                  >
                    Compose <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Compose dialog */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Slip — what {composeCtx?.userLabel} receives</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {templates.length > 0 && (
              <div className="flex items-center gap-3">
                <Label className="text-xs shrink-0">Template</Label>
                <select
                  className="border rounded-md px-2 py-1.5 text-sm"
                  onChange={(e) => e.target.value && applyTemplate(e.target.value)}
                  defaultValue=""
                >
                  <option value="">— pick a form letter —</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs">Subject</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
            <div className="rounded-lg border overflow-hidden">
              <div
                className="px-4 py-2 text-[12px] uppercase tracking-wide font-semibold text-white"
                style={{ backgroundColor: "#0e2a4a" }}
              >
                Review slip preview
              </div>
              <div className="divide-y">
                {composeCtx?.postStatus && (
                  <Row k="Status" v={composeCtx.postStatus === "pending" ? "Pending — not yet approved" : composeCtx.postStatus} />
                )}
                {composeCtx?.postTitle && <Row k="Post" v={composeCtx.postTitle} />}
                <RowEdit k="Reason" v={reason} onChange={setReason} placeholder="e.g. too general — could describe any job" />
                <RowEdit k="Suggestions" v={suggestions} onChange={setSuggestions} placeholder="e.g. one specific detail about what architects do" />
                <RowEdit k="Deadline" v={deadline} onChange={setDeadline} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="also-email"
                checked={alsoEmail}
                onCheckedChange={(v) => setAlsoEmail(v === true)}
              />
              <Label htmlFor="also-email" className="text-sm">
                Also send as email
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setComposeOpen(false)}>
              Cancel
            </Button>
            <Button onClick={sendSlip} disabled={sending}>
              {sending ? "Sending…" : "Send slip"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New-thread user picker */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Start a new conversation</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                placeholder="Search by name or username…"
                value={pickerQuery}
                onChange={(e) => setPickerQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="max-h-80 overflow-y-auto rounded-md border">
              {pickerLoading ? (
                <div className="py-8 text-center text-sm text-muted-foreground">Searching…</div>
              ) : pickerResults.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">No users found.</div>
              ) : (
                pickerResults.map((p) => {
                  const label = p.name ?? p.username ?? "Unknown";
                  return (
                    <button
                      key={p.id}
                      onClick={() => startNewThreadWith(p)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/50 border-b last:border-b-0"
                    >
                      <div
                        className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-[13px] font-semibold text-white"
                        style={{ backgroundColor: "hsl(var(--secondary))" }}
                      >
                        {label.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{label}</div>
                        {p.username && p.name && (
                          <div className="text-xs text-muted-foreground truncate">@{p.username}</div>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPickerOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      <ManageTemplatesDialog
        open={templatesOpen}
        onOpenChange={(o) => {
          setTemplatesOpen(o);
          if (!o) fetchTemplates();
        }}
      />
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-[130px_1fr]">
      <div className="px-3 py-2 text-[11px] uppercase tracking-wider font-semibold bg-muted/40" style={{ color: "#1e2a44" }}>
        {k}
      </div>
      <div className="px-3 py-2 text-sm">{v}</div>
    </div>
  );
}

function RowEdit({
  k,
  v,
  onChange,
  placeholder,
}: {
  k: string;
  v: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="grid grid-cols-[130px_1fr]">
      <div className="px-3 py-2 text-[11px] uppercase tracking-wider font-semibold bg-muted/40" style={{ color: "#1e2a44" }}>
        {k}
      </div>
      <Textarea
        rows={2}
        value={v}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="border-0 rounded-none focus-visible:ring-0 resize-none text-sm"
      />
    </div>
  );
}
