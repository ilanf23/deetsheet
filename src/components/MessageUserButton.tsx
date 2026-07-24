import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface MessageUserButtonProps {
  targetUserId: string;
  targetUserLabel?: string | null;
}

/**
 * Opens (or creates) a direct 1:1 message thread with `targetUserId` and
 * navigates to that thread. Hidden when viewing your own profile or when
 * signed out (the parent already gates on `!isOwnProfile`, but we double-check).
 */
export default function MessageUserButton({
  targetUserId,
  targetUserLabel,
}: MessageUserButtonProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  if (!user || user.id === targetUserId) return null;

  const openThread = async () => {
    setBusy(true);
    try {
      // Look for an existing direct thread between the two users (either
      // ordering of user_id/other_user_id).
      const pairFilter =
        `and(user_id.eq.${user.id},other_user_id.eq.${targetUserId}),` +
        `and(user_id.eq.${targetUserId},other_user_id.eq.${user.id})`;
      const { data: existing } = await supabase
        .from("message_threads")
        .select("id")
        .eq("kind", "direct")
        .or(pairFilter)
        .maybeSingle();

      if (existing?.id) {
        navigate(`/inbox/${existing.id}`);
        return;
      }

      const subject = targetUserLabel
        ? `Chat with ${targetUserLabel}`
        : "Direct message";

      const { data: created, error } = await supabase
        .from("message_threads")
        .insert({
          kind: "direct",
          user_id: user.id,
          other_user_id: targetUserId,
          subject,
          status: "open",
          last_sender: "user",
        })
        .select("id")
        .single();

      if (error || !created) {
        toast({
          title: "Couldn't start chat",
          description: error?.message ?? "Please try again.",
          variant: "destructive",
        });
        return;
      }
      navigate(`/inbox/${created.id}`);
    } finally {
      setBusy(false);
    }
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
