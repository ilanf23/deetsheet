import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";

type ThreadReport = {
  id: string;
  thread_id: string;
  reporter_id: string;
  reported_user_id: string | null;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
};

type MessageRow = {
  id: string;
  sender_id: string;
  body_text: string | null;
  created_at: string;
  deleted_at: string | null;
};

/**
 * Message-thread reports filed by members, shown alongside post reports so
 * moderators have one place to review abuse.
 */
export default function MessageReportsPanel() {
  const { toast } = useToast();
  const [reports, setReports] = useState<ThreadReport[]>([]);
  const [messages, setMessages] = useState<Record<string, MessageRow[]>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase
      .from("thread_reports")
      .select("id,thread_id,reporter_id,reported_user_id,reason,details,status,created_at")
      .eq("status", "open")
      .order("created_at", { ascending: false });
    setReports((data ?? []) as ThreadReport[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const toggle = async (r: ThreadReport) => {
    if (expanded === r.id) {
      setExpanded(null);
      return;
    }
    setExpanded(r.id);
    if (!messages[r.thread_id]) {
      const { data } = await supabase
        .from("messages")
        .select("id,sender_id,body_text,created_at,deleted_at")
        .eq("thread_id", r.thread_id)
        .order("created_at");
      setMessages((prev) => ({ ...prev, [r.thread_id]: (data ?? []) as MessageRow[] }));
    }
  };

  const resolve = async (r: ThreadReport, status: "resolved" | "dismissed") => {
    const { error } = await supabase
      .from("thread_reports")
      .update({ status })
      .eq("id", r.id);
    if (error) {
      toast({ title: "Couldn't update", description: error.message, variant: "destructive" });
      return;
    }
    setReports((prev) => prev.filter((x) => x.id !== r.id));
  };

  if (loading || reports.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-[15px] font-semibold" style={{ color: "hsl(var(--admin-fg))" }}>
        Message reports ({reports.length})
      </h2>
      <div className="space-y-3">
        {reports.map((r) => (
          <div
            key={r.id}
            className="rounded-xl p-5"
            style={{
              backgroundColor: "hsl(var(--admin-surface))",
              border: "1px solid hsl(var(--admin-border))",
            }}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[14px] font-medium" style={{ color: "hsl(var(--admin-fg))" }}>
                  {r.reason}
                </p>
                {r.details && (
                  <p className="mt-1 text-[13px]" style={{ color: "hsl(var(--admin-fg-muted))" }}>
                    {r.details}
                  </p>
                )}
                <p className="mt-2 text-[12px]" style={{ color: "hsl(var(--admin-fg-muted))" }}>
                  {format(parseISO(r.created_at), "MMM d, yyyy · h:mm a")} ·{" "}
                  <Link to={`/inbox/${r.thread_id}`} className="text-primary hover:underline">
                    Open thread
                  </Link>
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => toggle(r)}
                  className="rounded-md border px-3 py-1.5 text-[13px]"
                >
                  {expanded === r.id ? "Hide messages" : "View messages"}
                </button>
                <button
                  type="button"
                  onClick={() => resolve(r, "resolved")}
                  className="rounded-md border px-3 py-1.5 text-[13px]"
                >
                  Resolve
                </button>
                <button
                  type="button"
                  onClick={() => resolve(r, "dismissed")}
                  className="rounded-md border px-3 py-1.5 text-[13px]"
                >
                  Dismiss
                </button>
              </div>
            </div>

            {expanded === r.id && (
              <div className="mt-4 space-y-2 border-t pt-4">
                {(messages[r.thread_id] ?? []).map((m) => (
                  <div key={m.id} className="rounded-md border p-3">
                    <p className="text-[12px]" style={{ color: "hsl(var(--admin-fg-muted))" }}>
                      {m.sender_id === r.reported_user_id ? "Reported member" : "Reporter"} ·{" "}
                      {format(parseISO(m.created_at), "MMM d, h:mm a")}
                    </p>
                    {m.deleted_at ? (
                      <p className="mt-1 text-[13px] italic text-muted-foreground">
                        This message was deleted
                      </p>
                    ) : (
                      <p className="mt-1 whitespace-pre-wrap text-[13px]">{m.body_text}</p>
                    )}
                  </div>
                ))}
                {(messages[r.thread_id] ?? []).length === 0 && (
                  <p className="text-[13px]" style={{ color: "hsl(var(--admin-fg-muted))" }}>
                    No messages in this thread.
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
