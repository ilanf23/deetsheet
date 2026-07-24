import { useEffect, useState } from "react";
import { Navigate, useParams, Link } from "react-router-dom";
import DeetHeader from "@/components/DeetHeader";
import DeetFooter from "@/components/DeetFooter";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { format, parseISO } from "date-fns";

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
};

type ProfileLite = { id: string; name: string | null; username: string | null };

export default function InboxThread() {
  const { threadId } = useParams<{ threadId: string }>();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [thread, setThread] = useState<Thread | null>(null);
  const [otherProfile, setOtherProfile] = useState<ProfileLite | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const load = async () => {
    if (!threadId || !user) return;
    const { data: t } = await supabase
      .from("message_threads")
      .select("id,subject,user_id,other_user_id,kind,status")
      .eq("id", threadId)
      .maybeSingle();
    if (!t) {
      setNotFound(true);
      return;
    }
    setThread(t as Thread);

    // Resolve counterpart profile for direct threads (title + sender label).
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
        if (p) setOtherProfile(p as ProfileLite);
      }
    }

    const { data: m } = await supabase
      .from("messages")
      .select("id,sender_id,sender_role,body_html,body_text,slip,created_at")
      .eq("thread_id", threadId)
      .order("created_at");
    setMessages((m ?? []) as Message[]);

    // Per-participant read state: primary user updates last_read_at; the
    // direct-thread counterpart updates other_last_read_at.
    const isCounterpart =
      (t as Thread).kind === "direct" && (t as Thread).other_user_id === user.id;
    const patch = isCounterpart
      ? { other_last_read_at: new Date().toISOString() }
      : { last_read_at: new Date().toISOString() };
    await supabase.from("message_threads").update(patch).eq("id", threadId);
  };

  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId, user]);

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (notFound) return <Navigate to="/inbox" replace />;

  const otherName = otherProfile?.name || otherProfile?.username || "user";
  const headerTitle =
    thread?.kind === "direct" ? `Chat with ${otherName}` : thread?.subject;

  const senderLabel = (m: Message) => {
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
      sender_role: "user",
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

  return (
    <div className="min-h-screen flex flex-col">
      <DeetHeader />
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8">
        <Link to="/inbox" className="text-sm text-primary hover:underline">
          ← Back to inbox
        </Link>
        <h1 className="text-2xl font-bold mt-3 mb-6">{headerTitle}</h1>

        <div className="space-y-4">
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
                {m.slip && Object.keys(m.slip).length > 0 ? (
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
                ) : m.body_text ? (
                  <div className="whitespace-pre-wrap text-sm">{m.body_text}</div>
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

        <div className="mt-6 space-y-2">
          <Textarea
            rows={4}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Write a reply…"
          />
          <div className="flex justify-end">
            <Button onClick={sendReply} disabled={sending || !reply.trim()}>
              {sending ? "Sending…" : "Send reply"}
            </Button>
          </div>
        </div>
      </main>
      <DeetFooter />
    </div>
  );
}
