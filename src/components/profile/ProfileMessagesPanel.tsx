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
  last_message_at: string;
  last_sender: string;
  last_read_at: string | null;
};

export default function ProfileMessagesPanel() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("message_threads")
        .select("id,subject,status,last_message_at,last_sender,last_read_at")
        .eq("user_id", user.id)
        .order("last_message_at", { ascending: false });
      setThreads((data ?? []) as Thread[]);
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

  return (
    <Card className="bg-card">
      <CardContent className="p-0">
        <ul className="divide-y">
          {threads.map((t) => {
            const unread =
              t.last_sender === "admin" &&
              (!t.last_read_at || new Date(t.last_read_at) < new Date(t.last_message_at));
            return (
              <li key={t.id}>
                <Link
                  to={`/inbox/${t.id}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-muted/40"
                >
                  <div className="min-w-0 flex-1">
                    <div className={`truncate text-primary hover:underline ${unread ? "font-semibold" : ""}`}>
                      {t.subject}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(parseISO(t.last_message_at))} ago · from{" "}
                      {t.last_sender === "admin" ? "DeetSheet team" : "you"}
                    </div>
                  </div>
                  {unread && (
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
