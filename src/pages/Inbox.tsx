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
  last_message_at: string;
  last_sender: string;
  last_read_at: string | null;
  post_id: string | null;
};

export default function Inbox() {
  const { user, loading } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("message_threads")
        .select("id,subject,status,last_message_at,last_sender,last_read_at,post_id")
        .eq("user_id", user.id)
        .order("last_message_at", { ascending: false });
      setThreads((data ?? []) as Thread[]);
      setBusy(false);
    })();
  }, [user]);

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

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
              const unread = t.last_sender === "admin" && (!t.last_read_at || new Date(t.last_read_at) < new Date(t.last_message_at));
              return (
                <li key={t.id}>
                  <Link
                    to={`/inbox/${t.id}`}
                    className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-muted/40"
                  >
                    <div className="min-w-0 flex-1">
                      <div className={`truncate ${unread ? "font-semibold" : ""}`}>
                        {t.subject}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(parseISO(t.last_message_at))} ago · from{" "}
                        {t.last_sender === "admin" ? "DeetSheet team" : "you"}
                      </div>
                    </div>
                    {unread && (
                      <span className="h-2 w-2 rounded-full bg-secondary shrink-0" aria-label="unread" />
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
