import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { format, parseISO } from "date-fns";
import MarkdownLinkText from "@/components/MarkdownLinkText";
import { sanitizeHtml } from "@/lib/sanitizeHtml";


type Message = {
  id: string;
  sender_id: string;
  sender_role: string;
  body_html: string | null;
  body_text: string | null;
  slip: any;
  created_at: string;
};

type Thread = {
  id: string;
  subject: string;
  user_id: string;
  other_user_id: string | null;
  kind: string;
  status: string;
  request_status: string | null;
  initiated_by: string | null;
};

type ProfileLite = { id: string; name: string | null; username: string | null };

interface ThreadConversationProps {
  threadId: string;
  /** Called once the thread is loaded, with the resolved display title. */
  onTitle?: (title: string) => void;
  /** Called when the thread cannot be loaded (missing / not permitted). */
  onNotFound?: () => void;
  /** Called after the thread is marked read or a reply is sent. */
  onRead?: () => void;
  /** Called with thread metadata the parent needs (counterpart, request state). */
  onMeta?: (meta: { otherUserId: string | null; isDirect: boolean }) => void;
  /** Called after a request is accepted or declined. */
  onRequestResolved?: () => void;
  /** Update the thread's read timestamps. Admins viewing a member thread pass false. */
  markRead?: boolean;
  /** Role stamped on replies sent from this view. */
  senderRole?: "user" | "admin";
  /** Admin reading a member's thread — changes the sender labels only. */
  adminView?: boolean;
  /** Display name for the member, used by the admin view's sender labels. */
  memberLabel?: string | null;
}

export default function ThreadConversation({
  threadId,
  onTitle,
  onNotFound,
  onRead,
  onMeta,
  onRequestResolved,
  markRead = true,
  senderRole = "user",
  adminView = false,
  memberLabel,
}: ThreadConversationProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [thread, setThread] = useState<Thread | null>(null);
  const [otherProfile, setOtherProfile] = useState<ProfileLite | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!threadId || !user) return;
    const { data: t } = await supabase
      .from("message_threads")
      .select(
        "id,subject,user_id,other_user_id,kind,status,request_status,initiated_by",
      )
      .eq("id", threadId)
      .maybeSingle();
    if (!t) {
      setLoading(false);
      onNotFound?.();
      return;
    }
    setThread(t as Thread);
    onMeta?.({
      otherUserId:
        (t as Thread).kind === "direct"
          ? (t as Thread).user_id === user.id
            ? (t as Thread).other_user_id
            : (t as Thread).user_id
          : null,
      isDirect: (t as Thread).kind === "direct",
    });

    // Resolve counterpart profile for direct threads (title + sender label).
    let other: ProfileLite | null = null;
    if ((t as Thread).kind === "direct") {
      const otherId =
        (t as Thread).user_id === user.id
          ? (t as Thread).other_user_id
          : (t as Thread).user_id;
      if (otherId) {
        const { data: p } = await supabase
          .from("profiles")
          .select("id,name,username")
          .eq("id", otherId)
          .maybeSingle();
        if (p) {
          other = p as ProfileLite;
          setOtherProfile(other);
        }
      }
    }

    onTitle?.(
      (t as Thread).kind === "direct"
        ? `Chat with ${other?.name || other?.username || "user"}`
        : (t as Thread).subject,
    );

    const { data: m } = await supabase
      .from("messages")
      .select("id,sender_id,sender_role,body_html,body_text,slip,created_at")
      .eq("thread_id", threadId)
      .order("created_at");
    setMessages((m ?? []) as Message[]);
    setLoading(false);

    // Per-participant read state: primary user updates last_read_at; the
    // direct-thread counterpart updates other_last_read_at. Admins reading a
    // member's thread must not touch the member's read state.
    if (markRead) {
      const isCounterpart =
        (t as Thread).kind === "direct" && (t as Thread).other_user_id === user.id;
      const patch = isCounterpart
        ? { other_last_read_at: new Date().toISOString() }
        : { last_read_at: new Date().toISOString() };
      await supabase.from("message_threads").update(patch).eq("id", threadId);
      onRead?.();
    }
  };

  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId, user]);

  if (!user) return null;

  const otherName = otherProfile?.name || otherProfile?.username || "user";

  const senderLabel = (m: Message) => {
    if (adminView) {
      return m.sender_role === "admin"
        ? "DeetSheet team"
        : memberLabel || otherName || "Member";
    }
    if (thread?.kind === "direct") {
      return m.sender_id === user.id ? "You" : otherName;
    }
    return m.sender_role === "admin" ? "DeetSheet team" : "You";
  };

  const sendReply = async () => {
    if (!reply.trim() || !thread) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      thread_id: thread.id,
      sender_id: user.id,
      sender_role: senderRole,
      body_text: reply.trim(),
      body_html: `<p>${reply.trim().replace(/\n/g, "<br/>")}</p>`,
    });
    setSending(false);
    if (error) {
      toast({ title: "Reply failed", description: error.message, variant: "destructive" });
      return;
    }
    setReply("");
    load();
  };

  const isPendingRequest =
    thread?.kind === "direct" && thread?.request_status === "pending";
  const iAmRecipient = isPendingRequest && thread?.initiated_by !== user.id;

  const resolveRequest = async (accepted: boolean) => {
    if (!thread) return;
    setSending(true);
    const { error } = await supabase
      .from("message_threads")
      .update({ request_status: accepted ? "accepted" : "declined" })
      .eq("id", thread.id);
    setSending(false);
    if (error) {
      toast({ title: "Couldn't update", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: accepted ? "Request accepted" : "Request declined",
      description: accepted
        ? "This conversation moved to your inbox."
        : "You won't receive further messages here.",
    });
    onRequestResolved?.();
    load();
  };

  if (loading) {
    return <div className="py-8 text-center text-sm text-muted-foreground">Loading…</div>;
  }


  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {messages.map((m) => {
          const mine = m.sender_id === user.id;
          return (
            <div
              key={m.id}
              className={`rounded-lg border p-4 ${mine ? "bg-background" : "bg-muted/30"}`}
            >
              <div className="text-xs text-muted-foreground mb-2">
                {senderLabel(m)} · {format(parseISO(m.created_at), "MMM d, yyyy · h:mm a")}
              </div>
              {m.slip &&
              (["status", "post", "reason", "suggestions"] as const).some((k) =>
                String(m.slip?.[k] ?? "").trim(),
              ) ? (

                <div className="rounded border overflow-hidden text-sm">
                  {(["status", "post", "reason", "suggestions", "deadline_text"] as const).map(
                    (k) =>
                      m.slip?.[k] ? (
                        <div
                          key={k}
                          className="grid grid-cols-[110px_1fr] border-b last:border-b-0"
                        >
                          <div className="px-3 py-2 text-[11px] uppercase font-semibold bg-muted/40">
                            {k === "deadline_text" ? "Deadline" : k}
                          </div>
                          <div className="px-3 py-2 whitespace-pre-wrap">{m.slip[k]}</div>
                        </div>
                      ) : null,
                  )}
                </div>
              ) : m.body_text && m.body_text.trim() ? (
                <MarkdownLinkText
                  text={m.body_text}
                  className="block whitespace-pre-wrap text-sm leading-relaxed [&_a]:text-primary [&_a]:underline"
                />
              ) : m.body_html ? (
                <div
                  className="text-sm leading-relaxed [&_a]:text-primary [&_a]:underline"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(m.body_html) }}
                />
              ) : null}

            </div>
          );
        })}
        {messages.length === 0 && (
          <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
            No messages yet — say hi below.
          </div>
        )}
      </div>

      {thread?.request_status === "declined" ? (
        <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
          You declined this message request.
        </div>
      ) : iAmRecipient ? (
        <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
          <p className="text-sm text-foreground">
            {otherName} wants to start a conversation with you.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" disabled={sending} onClick={() => resolveRequest(true)}>
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={sending}
              onClick={() => resolveRequest(false)}
            >
              Decline
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {isPendingRequest && (
            <p className="text-xs text-muted-foreground">
              This is a message request — {otherName} needs to accept it before you can
              keep chatting.
            </p>
          )}
          <Textarea
            rows={4}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Write a reply…"
          />
          <div className="flex justify-end">
            <Button onClick={sendReply} disabled={sending || !reply.trim()}>
              {sending ? "Sending…" : "Send Message"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
