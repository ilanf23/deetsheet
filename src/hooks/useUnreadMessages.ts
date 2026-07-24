import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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
        .select("id, last_message_at, last_read_at, last_sender")
        .eq("user_id", user.id)
        .eq("last_sender", "admin");
      if (error) return 0;
      return (data ?? []).filter(
        (t) => !t.last_read_at || new Date(t.last_read_at) < new Date(t.last_message_at)
      ).length;
    },
  });
}
