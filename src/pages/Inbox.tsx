import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import DeetHeader from "@/components/DeetHeader";
import DeetFooter from "@/components/DeetFooter";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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
};

type ProfileLite = { id: string; name: string | null; username: string | null };

export default function Inbox() {
  const { user, loading } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [profileMap, setProfileMap] = useState<Map<string, ProfileLite>>(new Map());
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      // Threads where I'm either the user_id party OR the direct-DM
      // counterpart. RLS enforces the same rule server-side.
      const { data } = await supabase
        .from("message_threads")
        .select(
          "id,subject,status,kind,user_id,other_user_id,last_message_at,last_sender,last_read_at,other_last_read_at,post_id",
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
    })();
  }, [user]);

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  const displayFor = (t: Thread) => {
    if (t.kind !== "direct") {
      return {
        title: t.subject,
        senderLabel: t.last_sender === "admin" ? "DeetSheet team" : "you",
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
    const otherIsSender =
      (isPrimary && t.last_sender !== "user_primary") &&
      // last_sender for direct threads is always 'user' — distinguish by sender_id
      // is expensive per row; fall back to last message time comparison instead.
      false;
    // Unread = last message time is newer than my last read AND I wasn't the last sender
    const iSentLast = isPrimary
      ? t.last_sender === "user" && myRead && new Date(myRead) >= new Date(t.last_message_at)
      : false;
    const unread =
      (!myRead || new Date(myRead) < new Date(t.last_message_at)) && !iSentLast;
    return {
      title: `Chat with ${otherName}`,
      senderLabel: otherName,
      unread,
    };
  };

  return (
    <div className="min-h-screen flex flex-col">
      <DeetHeader />
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Inbox</h1>
        {busy ? (
          <div className="text-muted-foreground text-sm">Loading…</div>
        ) : threads.length === 0 ? (
          <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
            You have no messages yet.
          </div>
        ) : (
          <ul className="divide-y border rounded-lg overflow-hidden">
            {threads.map((t) => {
              const d = displayFor(t);
              return (
                <li key={t.id}>
                  <Link
                    to={`/inbox/${t.id}`}
                    className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-muted/40"
                  >
                    <div className="min-w-0 flex-1">
                      <div className={`truncate ${d.unread ? "font-semibold" : ""}`}>
                        {d.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(parseISO(t.last_message_at))} ago · from{" "}
                        {d.senderLabel}
                      </div>
                    </div>
                    {d.unread && (
                      <span
                        className="h-2 w-2 rounded-full bg-secondary shrink-0"
                        aria-label="unread"
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <DeetFooter />
    </div>
  );
}
