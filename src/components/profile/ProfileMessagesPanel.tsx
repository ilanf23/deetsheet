import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import ThreadDialog from "@/components/inbox/ThreadDialog";
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
};

type ProfileLite = { id: string; name: string | null; username: string | null };

export default function ProfileMessagesPanel() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [profileMap, setProfileMap] = useState<Map<string, ProfileLite>>(new Map());
  const [loading, setLoading] = useState(true);
  const [openThreadId, setOpenThreadId] = useState<string | null>(null);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("message_threads")
        .select(
          "id,subject,status,kind,user_id,other_user_id,last_message_at,last_sender,last_read_at,other_last_read_at",
        )
        .or(`user_id.eq.${user.id},other_user_id.eq.${user.id}`)
        .order("last_message_at", { ascending: false });
      const rows = (data ?? []) as Thread[];
      setThreads(rows);

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
      setLoading(false);
    })();
  }, [user]);

  if (loading) {
    return (
      <Card className="bg-card">
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Loading messages…
        </CardContent>
      </Card>
    );
  }

  if (threads.length === 0) {
    return (
      <Card className="bg-card">
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          You have no messages yet.
        </CardContent>
      </Card>
    );
  }

  const displayFor = (t: Thread) => {
    if (t.kind !== "direct") {
      return {
        title: t.subject,
        senderLabel: t.last_sender === "admin" ? "DeetSheet team" : "you",
        unread:
          t.last_sender === "admin" &&
          (!t.last_read_at ||
            new Date(t.last_read_at) < new Date(t.last_message_at)),
      };
    }
    const isPrimary = t.user_id === user!.id;
    const otherId = isPrimary ? t.other_user_id : t.user_id;
    const other = otherId ? profileMap.get(otherId) : null;
    const otherName = other?.name || other?.username || "user";
    const myRead = isPrimary ? t.last_read_at : t.other_last_read_at;
    return {
      title: `Chat with ${otherName}`,
      senderLabel: otherName,
      unread: !myRead || new Date(myRead) < new Date(t.last_message_at),
    };
  };

  return (
    <>
      <Card className="bg-card">
        <CardContent className="p-0">
          <ul className="divide-y">
            {threads.map((t) => {
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
                      <div
                        className={`truncate text-primary ${unread ? "font-semibold" : ""}`}
                      >
                        {d.title}
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
        </CardContent>
      </Card>
      <ThreadDialog
        threadId={openThreadId}
        onOpenChange={(open) => !open && setOpenThreadId(null)}
        onRead={(id) => setReadIds((prev) => new Set(prev).add(id))}
      />
    </>
  );
}
