import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, Mail, MailOpen, Reply } from "lucide-react";
import AdminSortSelect from "@/components/admin/AdminSortSelect";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type SortKey =
  | "newest"
  | "oldest"
  | "name_asc"
  | "name_desc"
  | "unread_first"
  | "read_first";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Date - Newest" },
  { value: "oldest", label: "Date - Oldest" },
  { value: "name_asc", label: "Name - A to Z" },
  { value: "name_desc", label: "Name - Z to A" },
  { value: "unread_first", label: "Unread first" },
  { value: "read_first", label: "Read first" },
];

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  category: string | null;
  subject: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
  user_id: string | null;
}

export default function AdminContactMessages() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortKey>("newest");
  const [replyTarget, setReplyTarget] = useState<ContactMessage | null>(null);
  const [subjectValue, setSubjectValue] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [sending, setSending] = useState(false);

  /** Keeps the sidebar "Contact Messages" badge in step with this list. */
  const refreshBadge = () =>
    queryClient.invalidateQueries({ queryKey: ["admin-unread-contact"] });


  const sortedMessages = useMemo(() => {
    const cmpStr = (a: string, b: string) =>
      a.localeCompare(b, undefined, { sensitivity: "base" });
    const cmpDate = (a?: string | null, b?: string | null) =>
      new Date(a ?? 0).getTime() - new Date(b ?? 0).getTime();
    const arr = [...messages];
    switch (sort) {
      case "newest":
        arr.sort((a, b) => cmpDate(b.created_at, a.created_at));
        break;
      case "oldest":
        arr.sort((a, b) => cmpDate(a.created_at, b.created_at));
        break;
      case "name_asc":
        arr.sort((a, b) => cmpStr(a.name ?? "", b.name ?? ""));
        break;
      case "name_desc":
        arr.sort((a, b) => cmpStr(b.name ?? "", a.name ?? ""));
        break;
      case "unread_first":
        arr.sort((a, b) => {
          if (a.is_read !== b.is_read) return a.is_read ? 1 : -1;
          return cmpDate(b.created_at, a.created_at);
        });
        break;
      case "read_first":
        arr.sort((a, b) => {
          if (a.is_read !== b.is_read) return a.is_read ? -1 : 1;
          return cmpDate(b.created_at, a.created_at);
        });
        break;
    }
    return arr;
  }, [messages, sort]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });
      if (!mounted) return;
      if (error) {
        toast({ title: "Failed to load messages", description: error.message, variant: "destructive" });
      } else {
        setMessages((data ?? []) as ContactMessage[]);
      }
      setLoading(false);
    };
    load();

    const channel = supabase
      .channel("contact-messages")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contact_messages" },
        (payload) => {
          setMessages((prev) => {
            if (payload.eventType === "INSERT") {
              return [payload.new as ContactMessage, ...prev];
            }
            if (payload.eventType === "UPDATE") {
              return prev.map((m) => (m.id === (payload.new as ContactMessage).id ? (payload.new as ContactMessage) : m));
            }
            if (payload.eventType === "DELETE") {
              return prev.filter((m) => m.id !== (payload.old as ContactMessage).id);
            }
            return prev;
          });
          refreshBadge();
        },

      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [toast]);

  const toggleRead = async (msg: ContactMessage) => {
    const { error } = await supabase
      .from("contact_messages")
      .update({ is_read: !msg.is_read })
      .eq("id", msg.id);
    if (error) toast({ title: "Update failed", description: error.message, variant: "destructive" });
    else refreshBadge();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this message?")) return;
    const { error } = await supabase.from("contact_messages").delete().eq("id", id);
    if (error) toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    else refreshBadge();
  };

  const openReply = (msg: ContactMessage) => {
    setSubjectValue(`Re: ${msg.subject || "Your message to DeetSheet"}`);
    setReplyBody("");
    setReplyTarget(msg);
  };

  const sendReply = async () => {
    if (!replyTarget || sending || !replyBody.trim()) return;
    if (replyTarget.user_id === null) {
      toast({ title: "This visitor has no DeetSheet account — opening email client instead" });
      window.location.href = `mailto:${replyTarget.email}?subject=${encodeURIComponent(subjectValue)}&body=${encodeURIComponent(replyBody)}`;
      setReplyTarget(null);
      return;
    }

    setSending(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const accessToken = sess.session?.access_token;
      if (!accessToken) throw new Error("Please log in again before sending a reply.");
      const escapedBody = replyBody
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")
        .replace(/\r?\n/g, "<br/>");
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-admin-message`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: replyTarget.user_id,
            subject: subjectValue,
            body_html: `<p>${escapedBody}</p>`,
            send_email: true,
          }),
        },
      );
      const result = await response.json();
      if (!response.ok || result.error) throw new Error(result.error || "Failed to send reply");
      toast({ title: "Reply sent — delivered in-app and by email" });
      if (!replyTarget.is_read) {
        const { error } = await supabase.from("contact_messages").update({ is_read: true }).eq("id", replyTarget.id);
        if (error) {
          toast({ title: "Reply sent, but marking read failed", description: error.message, variant: "destructive" });
        } else {
          setMessages((prev) => prev.map((msg) => msg.id === replyTarget.id ? { ...msg, is_read: true } : msg));
          refreshBadge();
        }
      }
      setReplyTarget(null);
    } catch (error) {
      toast({ title: "Reply failed", description: error instanceof Error ? error.message : "Failed to send reply", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };


  const unreadCount = messages.filter((m) => !m.is_read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Contact Messages</h1>
          {loading ? (
            <Skeleton className="mt-1 h-4 w-36" />
          ) : (
            <p className="text-sm text-muted-foreground">
              {messages.length} total · {unreadCount} unread
            </p>
          )}
        </div>
        <AdminSortSelect
          variant="plain"
          value={sort}
          onChange={(v) => setSort(v as SortKey)}
          options={SORT_OPTIONS}
        />
      </div>

      {!loading && messages.length === 0 && (
        <div className="rounded-xl border bg-white p-8 text-center text-sm text-muted-foreground shadow-sm">
          No contact messages yet.
        </div>
      )}

      <div className="space-y-3">
        {loading &&
          [0, 1, 2].map((i) => (
            <div key={i} className="rounded-xl border bg-white p-4 shadow-sm" aria-label="Loading message">
              <div className="flex items-center gap-2 mb-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-3 w-24 mb-3" />
              <Skeleton className="h-4 w-full mb-1.5" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          ))}
        {sortedMessages.map((msg) => (
          <div
            key={msg.id}
            className={`rounded-xl border bg-white p-4 shadow-sm transition-colors hover:bg-slate-50/80 ${
              msg.is_read ? "border-border" : "border-primary/30 ring-1 ring-primary/10"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  {!msg.is_read && (
                    <span
                      className="h-2 w-2 shrink-0 rounded-full bg-secondary"
                      aria-label="Unread message"
                    />
                  )}
                  <span className="font-semibold text-foreground">{msg.name}</span>
                  <a href={`mailto:${msg.email}`} className="text-sm text-primary hover:underline">
                    {msg.email}
                  </a>
                  {msg.category && <Badge variant="secondary">{msg.category}</Badge>}
                  {!msg.is_read && <Badge>New</Badge>}
                </div>

                {msg.subject && (
                  <p className="text-sm font-medium text-foreground mb-1">{msg.subject}</p>
                )}
                <p className="text-sm text-foreground whitespace-pre-wrap break-words">{msg.message}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {new Date(msg.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <Button variant="outline" size="sm" className="text-primary" onClick={() => openReply(msg)}>
                  <Reply className="h-4 w-4" />
                  Reply
                </Button>
                <Button variant="outline" size="sm" onClick={() => toggleRead(msg)}>
                  {msg.is_read ? <Mail className="h-4 w-4" /> : <MailOpen className="h-4 w-4" />}
                  {msg.is_read ? "Mark unread" : "Mark read"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => remove(msg.id)}>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Dialog open={replyTarget !== null} onOpenChange={(open) => { if (!open && !sending) setReplyTarget(null); }}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Reply to contact message</DialogTitle>
          </DialogHeader>
          {replyTarget && (
            <blockquote className="border-l-2 border-border pl-4 text-sm text-muted-foreground break-words">
              <p className="font-semibold text-foreground">{replyTarget.name}</p>
              {replyTarget.subject && <p className="font-medium text-foreground">{replyTarget.subject}</p>}
              <p className="whitespace-pre-wrap">{replyTarget.message}</p>
            </blockquote>
          )}
          <div className="space-y-2">
            <Label htmlFor="contact-reply-subject">Subject</Label>
            <Input id="contact-reply-subject" value={subjectValue} onChange={(e) => setSubjectValue(e.target.value)} disabled={sending} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-reply-body">Reply</Label>
            <Textarea id="contact-reply-body" placeholder="Write your reply…" value={replyBody} onChange={(e) => setReplyBody(e.target.value)} disabled={sending} />
          </div>
          <DialogFooter>
            <Button variant="outline" className="text-primary" onClick={() => setReplyTarget(null)} disabled={sending}>Cancel</Button>
            <Button onClick={sendReply} disabled={sending || !replyBody.trim()}>Send Reply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
