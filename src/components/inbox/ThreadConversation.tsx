import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { format, parseISO } from "date-fns";
import { Trash2 } from "lucide-react";
import MarkdownLinkText from "@/components/MarkdownLinkText";
import { sanitizeHtml } from "@/lib/sanitizeHtml";
import { deleteMessage, DELETE_MESSAGE_WARNING } from "@/lib/messaging";
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


type Message = {
  id: string;
  sender_id: string;
  sender_role: string;
  body_html: string | null;
  body_text: string | null;
  slip: any;
  created_at: string;
  deleted_at: string | null;
  deleted_by: string | null;
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

type ProfileLite = {
  id: string;
  name: string | null;
  username: string | null;
  avatar_url?: string | null;
};

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
  /** Called after a reply is sent or a message is deleted, so lists can refresh. */
  onChanged?: () => void;
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
  onChanged,
}: ThreadConversationProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [thread, setThread] = useState<Thread | null>(null);
  const [otherProfile, setOtherProfile] = useState<ProfileLite | null>(null);
  const [senderProfiles, setSenderProfiles] = useState<Record<string, ProfileLite>>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<Message | null>(null);
  const [deleting, setDeleting] = useState(false);


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
          .select("id,name,username,avatar_url")
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
      .select(
        "id,sender_id,sender_role,body_html,body_text,slip,created_at,deleted_at,deleted_by",
      )
      .eq("thread_id", threadId)
      .order("created_at");
    setMessages((m ?? []) as Message[]);

    // Avatars/names for every sender in the thread (members only; admin
    // messages use the DeetSheet mark).
    const senderIds = Array.from(
      new Set(((m ?? []) as Message[]).map((x) => x.sender_id).filter(Boolean)),
    );
    if (senderIds.length) {
      const { data: ps } = await supabase
        .from("profiles")
        .select("id,name,username,avatar_url")
        .in("id", senderIds);
      const map: Record<string, ProfileLite> = {};
      (ps ?? []).forEach((p: any) => {
        map[p.id] = p as ProfileLite;
      });
      setSenderProfiles(map);
    }

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

  // Only the original sender may delete — plus admins, from the admin console.
  // RLS enforces the same rule server-side; this just hides the affordance.
  const canDelete = (m: Message) => !m.deleted_at && (adminView || m.sender_id === user.id);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    const { error } = await deleteMessage(pendingDelete.id, user.id);
    setDeleting(false);
    if (error) {
      toast({ title: "Couldn't delete", description: error, variant: "destructive" });
      return;
    }
    setPendingDelete(null);
    toast({ title: "Message deleted", description: "It no longer appears for either person." });
    await load();
    onChanged?.();
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
    await load();
    onChanged?.();
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
      <div className="space-y-1">
        {messages.map((m, i) => {
          const mine = m.sender_id === user.id;
          const prev = messages[i - 1];
          const next = messages[i + 1];
          const prevDate = prev ? parseISO(prev.created_at) : null;
          const date = parseISO(m.created_at);
          const showDateSeparator = !prev || !isSameDay(prevDate as Date, date);
          const runStart =
            showDateSeparator || !prev || prev.sender_id !== m.sender_id;
          const runEnd =
            !next ||
            next.sender_id !== m.sender_id ||
            !isSameDay(parseISO(next.created_at), date);

          const profile = senderProfiles[m.sender_id];
          const isAdminSender = m.sender_role === "admin";
          const label = senderLabel(m);

          const avatar = runEnd ? (
            <Avatar className="h-7 w-7 shrink-0">
              {isAdminSender ? (
                <AvatarImage src="/logo.png" alt="DeetSheet" className="object-contain" />
              ) : (
                <AvatarImage
                  src={profile?.avatar_url ?? undefined}
                  alt={label}
                  className="object-cover"
                />
              )}
              <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
                {(label || "?").trim().charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ) : (
            <span className="h-7 w-7 shrink-0" aria-hidden="true" />
          );

          return (
            <div key={m.id}>
              {showDateSeparator && (
                <div className="my-4 flex items-center justify-center">
                  <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-medium text-muted-foreground">
                    {format(date, "MMM d, yyyy")}
                  </span>
                </div>
              )}
              <div
                className={`flex items-end gap-2 ${runStart ? "mt-4" : "mt-1"} ${
                  mine ? "flex-row-reverse" : "flex-row"
                }`}
              >
                {avatar}
                <div
                  className={`flex min-w-0 max-w-[78%] flex-col sm:max-w-[70%] ${
                    mine ? "items-end" : "items-start"
                  }`}
                >
                  {runStart && (
                    <span className="mb-1 px-1 text-[11px] font-medium text-muted-foreground">
                      {label}
                    </span>
                  )}

                  {m.deleted_at ? (
                    <div className="rounded-2xl border border-dashed px-3 py-2 text-sm italic text-muted-foreground">
                      This message was deleted
                    </div>
                  ) : (
                    <div className="group relative">
                      {/* CSS triangle tail, drawn on the sender's side and
                          aligned to the bubble's top edge. */}
                      {runStart && (
                        <span
                          aria-hidden="true"
                          className={`absolute top-0 h-0 w-0 border-y-8 border-y-transparent ${
                            mine
                              ? "-right-[7px] border-l-8 border-l-primary"
                              : "-left-[7px] border-r-8 border-r-muted"
                          }`}
                        />
                      )}
                      <div
                        className={`relative rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                          mine
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground"
                        } ${
                          runStart
                            ? mine
                              ? "rounded-tr-[4px]"
                              : "rounded-tl-[4px]"
                            : ""
                        }`}
                      >
                        {m.slip &&
                        (["status", "post", "reason", "suggestions"] as const).some((k) =>
                          String(m.slip?.[k] ?? "").trim(),
                        ) ? (
                          <div className="overflow-hidden rounded border bg-background text-sm text-foreground">
                            {(
                              ["status", "post", "reason", "suggestions", "deadline_text"] as const
                            ).map((k) =>
                              m.slip?.[k] ? (
                                <div
                                  key={k}
                                  className="grid grid-cols-[110px_1fr] border-b last:border-b-0"
                                >
                                  <div className="bg-muted/40 px-3 py-2 text-[11px] font-semibold uppercase">
                                    {k === "deadline_text" ? "Deadline" : k}
                                  </div>
                                  <div className="whitespace-pre-wrap px-3 py-2">
                                    {m.slip[k]}
                                  </div>
                                </div>
                              ) : null,
                            )}
                          </div>
                        ) : m.body_text && m.body_text.trim() ? (
                          <MarkdownLinkText
                            text={m.body_text}
                            className={`block whitespace-pre-wrap [&_a]:underline ${
                              mine ? "[&_a]:text-primary-foreground" : "[&_a]:text-primary"
                            }`}
                          />
                        ) : m.body_html ? (
                          <div
                            className={`[&_a]:underline ${
                              mine ? "[&_a]:text-primary-foreground" : "[&_a]:text-primary"
                            }`}
                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(m.body_html) }}
                          />
                        ) : null}
                      </div>
                    </div>
                  )}

                  <div
                    className={`mt-1 flex items-center gap-2 px-1 ${
                      mine ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    <span className="text-[11px] text-muted-foreground">
                      {format(date, "h:mm a")}
                    </span>
                    {canDelete(m) && (
                      <button
                        type="button"
                        aria-label="Delete message"
                        title="Delete message"
                        onClick={() => setPendingDelete(m)}
                        className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
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

      <AlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(o) => !o && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this message?</AlertDialogTitle>
            <AlertDialogDescription>{DELETE_MESSAGE_WARNING}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Delete message"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

