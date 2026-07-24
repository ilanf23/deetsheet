import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
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
    <Card className="bg-card">
      <CardContent className="p-0">
        <ul className="divide-y">
          {threads.map((t) => {
            const d = displayFor(t);
            return (
              <li key={t.id}>
                <Link
                  to={`/inbox/${t.id}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-muted/40"
                >
                  <div className="min-w-0 flex-1">
                    <div
                      className={`truncate text-primary hover:underline ${d.unread ? "font-semibold" : ""}`}
                    >
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
      </CardContent>
    </Card>
  );
}
