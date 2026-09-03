import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { parseISO, format } from "date-fns";
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
import { LINK_SHORTCUTS, insertMarkdownLink } from "@/lib/linkShortcuts";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import AdminSortSelect from "@/components/admin/AdminSortSelect";
import ThreadConversation from "@/components/inbox/ThreadConversation";
import ManageTemplatesDialog from "@/components/admin/ManageTemplatesDialog";
import { ArrowLeft, ChevronDown, MessagesSquare, PenSquare, Search } from "lucide-react";

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
  /** Last non-deleted message text, used for the list preview. */
  snippet?: string | null;
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
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium"
      style={{ backgroundColor: bg, color: fg }}
    >
      {label}
    </span>
  );
}

export default function AdminMessages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { threadId: routeThreadId } = useParams<{ threadId: string }>();
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
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);

  /**
   * Insert a markdown link at the caret when the body textarea is focused;
   * otherwise place it before the sign-off line so it never fuses onto it.
   */
  const insertLink = (label: string, path: string) => {
    const el = bodyRef.current;
    const focused = el !== null && typeof document !== "undefined" && document.activeElement === el;
    const source = el?.value ?? messageBody;
    const { text, caret } = insertMarkdownLink(
      source,
      label,
      path,
      focused ? el!.selectionStart ?? null : null,
      focused ? el!.selectionEnd ?? null : null,
    );
    setMessageBody(text);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(caret, caret);
    });
  };

  const [alsoEmail, setAlsoEmail] = useState(true);

  const [sending, setSending] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);

  // New-thread user picker
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const [pickerResults, setPickerResults] = useState<any[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);

  const fetchAll = useCallback(async (opts?: { quiet?: boolean }) => {
    if (!opts?.quiet) setLoading(true);
    const { data: threadRows } = await supabase
      .from("message_threads")
      .select("id,user_id,post_id,subject,status,last_message_at,last_sender")
      .order("last_message_at", { ascending: false })
      .limit(200);
    const rows = (threadRows ?? []) as Thread[];

    const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
    const postIds = Array.from(new Set(rows.map((r) => r.post_id).filter(Boolean) as string[]));
    const threadIds = rows.map((r) => r.id);

    const [profRes, postsRes, msgRes] = await Promise.all([
      userIds.length
        ? supabase.from("profiles").select("id,name,username").in("id", userIds)
        : Promise.resolve({ data: [] as any[] }),
      postIds.length
        ? supabase.from("posts").select("id,title,status").in("id", postIds)
        : Promise.resolve({ data: [] as any[] }),
      threadIds.length
        ? supabase
            .from("messages")
            // Deleted messages are excluded here so a removed message can never
            // resurface as the list preview.
            .select("thread_id,body_text,body_html,slip,created_at")
            .in("thread_id", threadIds)
            .is("deleted_at", null)
            .order("created_at", { ascending: false })
            .limit(1000)
        : Promise.resolve({ data: [] as any[] }),
    ]);
    const pMap = new Map<string, any>();
    (profRes.data ?? []).forEach((p: any) => pMap.set(p.id, p));
    const postMap = new Map<string, any>();
    (postsRes.data ?? []).forEach((p: any) => postMap.set(p.id, p));
    const snippetMap = new Map<string, string>();
    (msgRes.data ?? []).forEach((m: any) => {
      if (snippetMap.has(m.thread_id)) return;
      snippetMap.set(m.thread_id, previewOf(m));
    });

    rows.forEach((r) => {
      const p = pMap.get(r.user_id);
      r.user_name = p?.name ?? null;
      r.user_username = p?.username ?? null;
      r.snippet = snippetMap.get(r.id) ?? null;
      if (r.post_id) {
        const post = postMap.get(r.post_id);
        r.post_title = post?.title ?? null;
        r.post_status = post?.status ?? null;
      }
    });

    setThreads(rows);
    setLoading(false);
  }, []);

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
  }, [fetchAll]);

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
    setMessageBody("");
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
    // Form letters are plain prose here — no slip rows in a direct message.
    const parts = [
      t.body_html ? htmlToPlainText(t.body_html) : "",
      t.reason_default ?? "",
      t.suggestions_default ?? "",
    ].filter((s) => s && s.trim().length > 0);
    if (parts.length) setMessageBody(parts.join("\n\n"));
  };

  const sendMessage = async () => {
    if (!composeCtx || !user || !messageBody.trim()) return;
    setSending(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const accessToken = sess.session?.access_token;
      const html = messageBody
        .split(/\n{2,}/)
        .map(
          (block) =>
            `<p>${escapeHtml(block.trim()).replace(/\n/g, "<br/>")}</p>`,
        )
        .join("");
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
            body_html: html,
            send_email: alsoEmail,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to send");
      toast({
        title: "Message sent",
        description: alsoEmail ? "Delivered in-app and by email." : "Delivered in-app.",
      });
      setComposeOpen(false);
      fetchAll({ quiet: true });
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

  const selected = threads.find((t) => t.id === routeThreadId) ?? null;
  const selectedLabel = selected?.user_name ?? selected?.user_username ?? "member";

  const selectThread = (id: string) => navigate(`/admin/messages/${id}`);
  const clearThread = () => navigate("/admin/messages");

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
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

      <div
        className="grid gap-0 rounded-xl overflow-hidden md:grid-cols-[minmax(280px,360px)_1fr]"
        style={{
          backgroundColor: "hsl(var(--admin-surface))",
          border: "1px solid hsl(var(--admin-border))",
          height: "calc(100vh - 210px)",
          minHeight: "520px",
        }}
      >
        {/* LEFT — conversation list */}
        <div
          className={`flex min-h-0 flex-col ${selected ? "hidden md:flex" : "flex"}`}
          style={{ borderRight: "1px solid hsl(var(--admin-border))" }}
        >
          <div
            className="space-y-3 p-3"
            style={{ borderBottom: "1px solid hsl(var(--admin-border))" }}
          >
            <Input
              placeholder="Search by user or post…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-full"
            />
            <div className="flex items-center gap-2 flex-wrap">
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
                      className="px-3 py-1 rounded-full text-[12px]"
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
                label="Sort"
                value={sort}
                onChange={(v) => setSort(v as SortKey)}
                options={SORT_OPTIONS}
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div
                  className="h-7 w-7 rounded-full animate-spin border-2"
                  style={{ borderColor: "hsl(var(--admin-primary))", borderTopColor: "transparent" }}
                />
              </div>
            ) : filtered.length === 0 ? (
              <div
                className="px-6 py-16 text-center text-[14px]"
                style={{ color: "hsl(var(--admin-fg-muted))" }}
              >
                No threads to show.
              </div>
            ) : (
              filtered.map((t) => {
                const label = t.user_name ?? t.user_username ?? "Unknown";
                const active = t.id === routeThreadId;
                const unread = t.last_sender === "user";
                return (
                  <div
                    key={t.id}
                    role="button"
                    tabIndex={0}
                    title="Open conversation"
                    onClick={() => selectThread(t.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        selectThread(t.id);
                      }
                    }}
                    className="flex cursor-pointer items-start gap-3 px-3 py-3 transition-colors hover:bg-muted/50"
                    style={{
                      borderBottom: "1px solid hsl(var(--admin-border))",
                      backgroundColor: active ? "hsl(var(--admin-primary-soft))" : undefined,
                    }}
                  >
                    <div
                      className="h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-[13px] font-semibold leading-none text-white"
                      style={{ backgroundColor: "hsl(var(--secondary))" }}
                    >
                      {label.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className="truncate text-[14px] font-semibold"
                          style={{ color: "hsl(var(--admin-fg))" }}
                        >
                          {label}
                        </span>
                        <span
                          className="shrink-0 text-[11px]"
                          style={{ color: "hsl(var(--admin-fg-muted))" }}
                        >
                          {format(parseISO(t.last_message_at), "MMM d")}
                        </span>
                      </div>
                      <div
                        className="truncate text-[12px]"
                        style={{ color: "hsl(var(--admin-fg-muted))" }}
                      >
                        {t.post_title ? `"${t.post_title}"` : t.subject}
                      </div>
                      {t.snippet && (
                        <div
                          className="mt-0.5 truncate text-[12px]"
                          style={{ color: "hsl(var(--admin-fg-muted))" }}
                        >
                          {t.snippet}
                        </div>
                      )}
                      <div className="mt-1.5 flex items-center gap-2">
                        <StatusPill status={t.status} lastSender={t.last_sender} />
                        {unread && (
                          <span
                            className="h-2 w-2 rounded-full bg-secondary"
                            aria-label="awaiting reply"
                          />
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openComposeForThread(t);
                          }}
                          className="ml-auto inline-flex items-center gap-1 text-[12px] font-semibold"
                          style={{ color: "hsl(var(--admin-primary))" }}
                        >
                          Compose <ChevronDown className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT — selected conversation */}
        <div className={`flex min-h-0 flex-col ${selected ? "flex" : "hidden md:flex"}`}>
          {routeThreadId ? (
            <>
              <div
                className="flex items-center gap-3 px-4 py-3"
                style={{ borderBottom: "1px solid hsl(var(--admin-border))" }}
              >
                <button
                  type="button"
                  onClick={clearThread}
                  aria-label="Back to conversations"
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-muted md:hidden"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div className="min-w-0">
                  <div
                    className="truncate text-[15px] font-semibold"
                    style={{ color: "hsl(var(--admin-fg))" }}
                  >
                    {selected?.post_title
                      ? `"${selected.post_title}"`
                      : selected?.subject ?? "Conversation"}
                  </div>
                  <div className="truncate text-[12px]" style={{ color: "hsl(var(--admin-fg-muted))" }}>
                    With{" "}
                    {selected ? (
                      <Link
                        to={`/profile/${selected.user_id}`}
                        className="hover:underline"
                        style={{ color: "hsl(var(--admin-primary))" }}
                      >
                        {selectedLabel}
                      </Link>
                    ) : (
                      "member"
                    )}
                  </div>
                </div>
                {selected && (
                  <button
                    onClick={() => openComposeForThread(selected)}
                    className="ml-auto inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-[13px] font-semibold"
                    style={{ color: "hsl(var(--admin-primary))" }}
                  >
                    Compose <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                <ThreadConversation
                  key={routeThreadId}
                  threadId={routeThreadId}
                  adminView
                  ownSide="team"
                  senderRole="admin"
                  markRead={false}
                  memberLabel={selected?.user_name ?? selected?.user_username ?? null}
                  onNotFound={clearThread}
                  onChanged={() => fetchAll({ quiet: true })}
                />
              </div>
            </>
          ) : (
            <div
              className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center"
              style={{ color: "hsl(var(--admin-fg-muted))" }}
            >
              <MessagesSquare className="h-8 w-8" />
              <p className="text-[14px]">Select a conversation to read it here.</p>
            </div>
          )}
        </div>
      </div>

      {/* Compose dialog */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Message {composeCtx?.userLabel}</DialogTitle>
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
                  <option value="">- pick a form letter -</option>
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
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label className="text-xs">Message</Label>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-muted-foreground">Insert link:</span>
                  {LINK_SHORTCUTS.map((l) => (
                    <Button
                      key={l.path}
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-6 px-2 text-[11px]"
                      onClick={() => insertLink(l.label, l.path)}
                    >
                      {l.label}
                    </Button>
                  ))}
                </div>
              </div>
              <Textarea
                ref={bodyRef}
                rows={9}
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                placeholder="Write your message…"
              />
              <p className="text-[11px] text-muted-foreground">
                Tip: you can write links by hand as [Rules](/rules).
              </p>
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
            <Button onClick={sendMessage} disabled={sending || !messageBody.trim()}>
              {sending ? "Sending…" : "Send Message"}
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

/** One-line preview for the list: slip rows fall back to a neutral label. */
function previewOf(m: { body_text: string | null; body_html: string | null; slip: any }) {
  if (m.body_text && m.body_text.trim()) return truncate(m.body_text.replace(/\s+/g, " ").trim());
  if (m.body_html) return truncate(htmlToPlainText(m.body_html).replace(/\s+/g, " ").trim());
  if (m.slip) return "Review update";
  return "";
}

function truncate(s: string, n = 90) {
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string),
  );
}

function htmlToPlainText(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
