import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { startDirectThread } from "@/lib/messaging";

type ProfileLite = { id: string; name: string | null; username: string | null };

interface NewMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the thread id once a conversation is opened or created. */
  onStarted: (threadId: string) => void;
}

export default function NewMessageDialog({
  open,
  onOpenChange,
  onStarted,
}: NewMessageDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<ProfileLite[]>([]);
  const [searching, setSearching] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setTerm("");
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    const q = term.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id,name,username")
        .or(`username.ilike.%${q}%,name.ilike.%${q}%`)
        .limit(10);
      if (cancelled) return;
      setResults(((data ?? []) as ProfileLite[]).filter((p) => p.id !== user?.id));
      setSearching(false);
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [term, user?.id]);

  const start = async (p: ProfileLite) => {
    if (!user) return;
    setBusyId(p.id);
    const { threadId, error } = await startDirectThread(
      user.id,
      p.id,
      p.name || p.username,
    );
    setBusyId(null);
    if (error || !threadId) {
      toast({
        title: "Couldn't start conversation",
        description: error ?? "Please try again.",
        variant: "destructive",
      });
      return;
    }
    onOpenChange(false);
    onStarted(threadId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 p-0">
        <DialogHeader className="border-b px-5 py-4 text-left">
          <DialogTitle className="text-lg leading-snug">New message</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 px-5 py-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search members by name or username"
              className="pl-9"
            />
          </div>
          <div className="max-h-72 overflow-y-auto">
            {term.trim().length < 2 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Type at least two characters to search.
              </p>
            ) : searching ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Searching…</p>
            ) : results.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No members found.
              </p>
            ) : (
              <ul className="divide-y">
                {results.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      disabled={busyId === p.id}
                      onClick={() => start(p)}
                      className="w-full px-2 py-3 text-left transition-colors hover:bg-muted/40"
                    >
                      <span className="block text-sm text-primary">
                        {p.name || p.username || "Member"}
                      </span>
                      {p.username && (
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          @{p.username}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
