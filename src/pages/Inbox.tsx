import { useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Plus } from "lucide-react";
import DeetHeader from "@/components/DeetHeader";
import DeetFooter from "@/components/DeetFooter";
import ThreadDialog from "@/components/inbox/ThreadDialog";
import NewMessageDialog from "@/components/inbox/NewMessageDialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserMessagingEnabled } from "@/hooks/useSiteSettings";
import { formatDistanceToNow, parseISO } from "date-fns";

type Thread = {
  id: string;
  subject: string;
  status: string;
  kind: string;
  user_id: string;
  other_user_id: string | null;
  last_message_at: string;
  last_sender: string;
  last_read_at: string | null;
  other_last_read_at: string | null;
  post_id: string | null;
  request_status: string | null;
  initiated_by: string | null;
};

type ProfileLite = { id: string; name: string | null; username: string | null };

export default function Inbox() {
  const { user, loading } = useAuth();
  const { data: messagingEnabled } = useUserMessagingEnabled();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [profileMap, setProfileMap] = useState<Map<string, ProfileLite>>(new Map());
  const [busy, setBusy] = useState(true);
  const [openThreadId, setOpenThreadId] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [tab, setTab] = useState<"inbox" | "requests">("inbox");
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const loadThreads = useCallback(async () => {
    if (!user) return;
    // Threads where I'm either the user_id party OR the direct-DM
    // counterpart. RLS enforces the same rule server-side.
    const { data } = await supabase
      .from("message_threads")
      .select(
        "id,subject,status,kind,user_id,other_user_id,last_message_at,last_sender,last_read_at,other_last_read_at,post_id,request_status,initiated_by",
      )
      .or(`user_id.eq.${user.id},other_user_id.eq.${user.id}`)
      .order("last_message_at", { ascending: false });
    const rows = (data ?? []) as Thread[];
    setThreads(rows);

    // Resolve counterpart display names for direct threads in one round-trip.
    const otherIds = Array.from(
      new Set(
        rows
          .filter((t) => t.kind === "direct")
          .map((t) => (t.user_id === user.id ? t.other_user_id : t.user_id))
          .filter((id): id is string => Boolean(id)),
      ),
    );
    if (otherIds.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id,name,username")
        .in("id", otherIds);
      const m = new Map<string, ProfileLite>();
      (profs ?? []).forEach((p: any) => m.set(p.id, p));
      setProfileMap(m);
    }
    setBusy(false);
  }, [user]);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  const isRequest = (t: Thread) =>
    t.kind === "direct" && t.request_status === "pending" && t.initiated_by !== user.id;

  const visible = threads.filter((t) => {
    if (t.kind === "direct" && t.request_status === "declined") return false;
    return tab === "requests" ? isRequest(t) : !isRequest(t);
  });
  const requestCount = threads.filter(isRequest).length;

  const displayFor = (t: Thread) => {
    if (t.kind !== "direct") {
      return {
        title: t.subject,
        senderLabel: t.last_sender === "admin" ? "DeetSheet team" : "you",
        fromTeam: true,
        unread:
          t.last_sender === "admin" &&
          (!t.last_read_at || new Date(t.last_read_at) < new Date(t.last_message_at)),
      };
    }
    const isPrimary = t.user_id === user.id;
    const otherId = isPrimary ? t.other_user_id : t.user_id;
    const other = otherId ? profileMap.get(otherId) : null;
    const otherName = other?.name || other?.username || "user";
    const myRead = isPrimary ? t.last_read_at : t.other_last_read_at;
    // Unread = last message time is newer than my last read AND I wasn't the last sender
    const iSentLast = isPrimary
      ? t.last_sender === "user" && myRead && new Date(myRead) >= new Date(t.last_message_at)
      : false;
    const unread =
      (!myRead || new Date(myRead) < new Date(t.last_message_at)) && !iSentLast;
    return {
      title: `Chat with ${otherName}`,
      senderLabel: otherName,
      fromTeam: false,
      unread,
    };
  };

  const tabClass = (value: "inbox" | "requests") =>
    `rounded-md px-3 py-1.5 text-sm transition-colors ${
      tab === value
        ? "bg-muted font-semibold text-foreground"
        : "text-muted-foreground hover:text-foreground"
    }`;

  return (
    <div className="min-h-screen flex flex-col">
      <DeetHeader />
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-bold">Inbox</h1>
          {messagingEnabled && (
            <Button size="sm" onClick={() => setNewOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              New message
            </Button>
          )}
        </div>

        <div className="mb-4 flex items-center gap-2">
          <button type="button" className={tabClass("inbox")} onClick={() => setTab("inbox")}>
            Inbox
          </button>
          <button
            type="button"
            className={tabClass("requests")}
            onClick={() => setTab("requests")}
          >
            Requests
            {requestCount > 0 && (
              <span className="ml-2 inline-flex h-4 min-w-[18px] items-center justify-center rounded-full bg-secondary px-1 text-[10px] font-semibold text-secondary-foreground">
                {requestCount > 99 ? "99+" : requestCount}
              </span>
            )}
          </button>
        </div>

        {busy ? (
          <div className="text-muted-foreground text-sm">Loading…</div>
        ) : visible.length === 0 ? (
          <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
            {tab === "requests"
              ? "No message requests right now."
              : "You have no messages yet."}
          </div>
        ) : (
          <ul className="divide-y border rounded-lg overflow-hidden">
            {visible.map((t) => {
              const d = displayFor(t);
              const unread = d.unread && !readIds.has(t.id);
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => setOpenThreadId(t.id)}
                    className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition-colors hover:bg-muted/40"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`truncate text-primary ${unread ? "font-semibold" : ""}`}
                        >
                          {d.title}
                        </span>
                        {d.fromTeam && (
                          <span className="shrink-0 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                            DeetSheet
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {formatDistanceToNow(parseISO(t.last_message_at))} ago · from{" "}
                        {d.senderLabel}
                      </div>
                    </div>
                    {unread && (
                      <span
                        className="h-2 w-2 shrink-0 rounded-full bg-secondary"
                        aria-label="unread"
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <ThreadDialog
        threadId={openThreadId}
        onOpenChange={(open) => !open && setOpenThreadId(null)}
        onRead={(id) => setReadIds((prev) => new Set(prev).add(id))}
        onChanged={loadThreads}
      />
      <NewMessageDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        onStarted={(id) => {
          loadThreads();
          setOpenThreadId(id);
        }}
      />
      <DeetFooter />
    </div>
  );
}
