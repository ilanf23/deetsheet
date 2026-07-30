import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useUserMessagingEnabled } from "@/hooks/useSiteSettings";
import { startDirectThread } from "@/lib/messaging";

interface MessageUserButtonProps {
  targetUserId: string;
  targetUserLabel?: string | null;
}

/**
 * Opens (or creates) a direct 1:1 message thread with `targetUserId` and
 * navigates to that thread. Hidden when viewing your own profile, when signed
 * out, or when member-to-member messaging is switched off site-wide.
 */
export default function MessageUserButton({
  targetUserId,
  targetUserLabel,
}: MessageUserButtonProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: messagingEnabled } = useUserMessagingEnabled();
  const [busy, setBusy] = useState(false);

  if (!user || user.id === targetUserId || !messagingEnabled) return null;

  const openThread = async () => {
    setBusy(true);
    const { threadId, error } = await startDirectThread(
      user.id,
      targetUserId,
      targetUserLabel,
    );
    setBusy(false);
    if (error || !threadId) {
      toast({
        title: "Couldn't start chat",
        description: error ?? "Please try again.",
        variant: "destructive",
      });
      return;
    }
    navigate(`/inbox/${threadId}`);
  };

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={openThread}
      disabled={busy}
      className="shrink-0"
    >
      <MessageSquare className="h-4 w-4 mr-1.5" />
      Message
    </Button>
  );
}
