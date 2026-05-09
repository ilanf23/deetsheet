import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Mail, MailOpen } from "lucide-react";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  category: string | null;
  subject: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
  user_id: string | null;
}

export default function AdminContactMessages() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });
      if (!mounted) return;
      if (error) {
        toast({ title: "Failed to load messages", description: error.message, variant: "destructive" });
      } else {
        setMessages((data ?? []) as ContactMessage[]);
      }
      setLoading(false);
    };
    load();

    const channel = supabase
      .channel("contact-messages")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contact_messages" },
        (payload) => {
          setMessages((prev) => {
            if (payload.eventType === "INSERT") {
              return [payload.new as ContactMessage, ...prev];
            }
            if (payload.eventType === "UPDATE") {
              return prev.map((m) => (m.id === (payload.new as ContactMessage).id ? (payload.new as ContactMessage) : m));
            }
            if (payload.eventType === "DELETE") {
              return prev.filter((m) => m.id !== (payload.old as ContactMessage).id);
            }
            return prev;
          });
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [toast]);

  const toggleRead = async (msg: ContactMessage) => {
    const { error } = await supabase
      .from("contact_messages")
      .update({ is_read: !msg.is_read })
      .eq("id", msg.id);
    if (error) toast({ title: "Update failed", description: error.message, variant: "destructive" });
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this message?")) return;
    const { error } = await supabase.from("contact_messages").delete().eq("id", id);
    if (error) toast({ title: "Delete failed", description: error.message, variant: "destructive" });
  };

  const unreadCount = messages.filter((m) => !m.is_read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contact Messages</h1>
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading…" : `${messages.length} total · ${unreadCount} unread`}
          </p>
        </div>
      </div>

      {!loading && messages.length === 0 && (
        <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
          No contact messages yet.
        </div>
      )}

      <div className="space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`rounded-lg border p-4 ${msg.is_read ? "bg-card" : "bg-muted/40 border-primary/30"}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-semibold text-foreground">{msg.name}</span>
                  <a href={`mailto:${msg.email}`} className="text-sm text-primary hover:underline">
                    {msg.email}
                  </a>
                  {msg.category && <Badge variant="secondary">{msg.category}</Badge>}
                  {!msg.is_read && <Badge>New</Badge>}
                </div>
                {msg.subject && (
                  <p className="text-sm font-medium text-foreground mb-1">{msg.subject}</p>
                )}
                <p className="text-sm text-foreground whitespace-pre-wrap break-words">{msg.message}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {new Date(msg.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={() => toggleRead(msg)}>
                  {msg.is_read ? <Mail className="h-4 w-4" /> : <MailOpen className="h-4 w-4" />}
                  {msg.is_read ? "Mark unread" : "Mark read"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => remove(msg.id)}>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
