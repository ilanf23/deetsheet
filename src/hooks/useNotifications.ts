import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface NotificationRow {
  id: string;
  type: string;
  message: string;
  link: string | null;
  post_id: string | null;
  thread_id: string | null;
  read_at: string | null;
  created_at: string;
}

/**
 * User notifications. Deliberately simple: no realtime channel — we refetch on
 * window focus and on a slow interval, matching the other read-mostly queries.
 */
export function useNotifications() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: ["notifications", userId],
    enabled: !!userId,
    refetchOnWindowFocus: true,
    refetchInterval: 60_000,
    queryFn: async (): Promise<NotificationRow[]> => {
      if (!userId) return [];
      const { data, error } = await (supabase.from("notifications") as any)
        .select("id, type, message, link, post_id, thread_id, read_at, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data ?? []) as NotificationRow[];
    },
  });
}

export function useUnreadNotificationCount() {
  const { data = [] } = useNotifications();
  return data.filter((n) => !n.read_at).length;
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("notifications") as any)
        .update({ read_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id ?? null] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await (supabase.from("notifications") as any)
        .update({ read_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .is("read_at", null);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id ?? null] });
    },
  });
}
