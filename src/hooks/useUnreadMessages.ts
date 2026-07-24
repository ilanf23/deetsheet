import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Unread message threads for the current user across both admin-sent and
 * user-to-user direct threads. For direct threads we track read state per
 * participant (`last_read_at` for the primary party, `other_last_read_at`
 * for the counterpart).
 */
export function useUnreadMessagesCount() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["unread-messages", user?.id],
    enabled: !!user,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      if (!user) return 0;
      const { data, error } = await supabase
        .from("message_threads")
        .select(
          "id,kind,user_id,other_user_id,last_message_at,last_read_at,other_last_read_at,last_sender",
        )
        .or(`user_id.eq.${user.id},other_user_id.eq.${user.id}`);
      if (error) return 0;
      return (data ?? []).filter((t: any) => {
        if (t.kind !== "direct") {
          return (
            t.last_sender === "admin" &&
            (!t.last_read_at ||
              new Date(t.last_read_at) < new Date(t.last_message_at))
          );
        }
        const isPrimary = t.user_id === user.id;
        const myRead = isPrimary ? t.last_read_at : t.other_last_read_at;
        return !myRead || new Date(myRead) < new Date(t.last_message_at);
      }).length;
    },
  });
}
