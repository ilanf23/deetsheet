import { useState } from "react";
import { Flag, MoreHorizontal, Ban } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { blockMember, reportThread, THREAD_REPORT_REASONS } from "@/lib/messaging";

interface ThreadActionsMenuProps {
  threadId: string;
  otherUserId: string | null;
  /** Fired after a block, so the parent can close/refresh the thread view. */
  onBlocked?: () => void;
}

export default function ThreadActionsMenu({
  threadId,
  otherUserId,
  onBlocked,
}: ThreadActionsMenuProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState(THREAD_REPORT_REASONS[0]);
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  if (!user) return null;

  const doBlock = async () => {
    if (!otherUserId) return;
    const { error } = await blockMember(user.id, otherUserId);
    if (error) {
      toast({ title: "Couldn't block", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Member blocked", description: "They can no longer message you." });
    onBlocked?.();
  };

  const submitReport = async () => {
    setBusy(true);
    const { error } = await reportThread({
      threadId,
      reporterId: user.id,
      reportedUserId: otherUserId,
      reason,
      details: details.trim() || undefined,
    });
    setBusy(false);
    if (error) {
      toast({ title: "Couldn't report", description: error.message, variant: "destructive" });
      return;
    }
    setReportOpen(false);
    setDetails("");
    toast({ title: "Report sent", description: "Our team will review this conversation." });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Conversation actions"
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onSelect={() => setReportOpen(true)}>
            <Flag className="mr-2 h-4 w-4" />
            Report conversation
          </DropdownMenuItem>
          {otherUserId && (
            <DropdownMenuItem onSelect={doBlock}>
              <Ban className="mr-2 h-4 w-4" />
              Block member
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Report this conversation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              {THREAD_REPORT_REASONS.map((r) => (
                <label key={r} className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="radio"
                    name="thread-report-reason"
                    checked={reason === r}
                    onChange={() => setReason(r)}
                  />
                  {r}
                </label>
              ))}
            </div>
            <Textarea
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Anything else we should know? (optional)"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setReportOpen(false)}>
                Cancel
              </Button>
              <Button onClick={submitReport} disabled={busy}>
                {busy ? "Sending…" : "Send report"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
