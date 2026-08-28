import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type ThreadCounts = { unread: number; requests: number; total: number };

const SELECT =
  "id,kind,user_id,other_user_id,last_message_at,last_read_at,other_last_read_at,hidden_for_user_at,hidden_for_other_at,last_sender,request_status,initiated_by";

/**
 * Unread threads plus pending message requests for the current user.
 * Message requests (a first message from a stranger) are counted separately so
 * they never inflate the main inbox badge.
 */
export function useThreadCounts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["unread-messages", user?.id],
    enabled: !!user,
    refetchOnWindowFocus: true,
    refetchInterval: 60_000,
    queryFn: async (): Promise<ThreadCounts> => {
      const empty = { unread: 0, requests: 0, total: 0 };
      if (!user) return empty;
      const { data, error } = await supabase
        .from("message_threads")
        .select(SELECT)
        .or(`user_id.eq.${user.id},other_user_id.eq.${user.id}`);
      if (error) return empty;

      let unread = 0;
      let requests = 0;
      let total = 0;
      (data ?? []).forEach((t: any) => {
        // Threads removed from this member's inbox don't count toward badges.
        const hidden = t.user_id === user.id ? t.hidden_for_user_at : t.hidden_for_other_at;
        if (hidden) return;
        if (t.kind !== "direct") {
          total += 1;
          if (
            t.last_sender === "admin" &&
            (!t.last_read_at || new Date(t.last_read_at) < new Date(t.last_message_at))
          ) {
            unread += 1;
          }
          return;
        }
        if (t.request_status === "declined") return;
        if (t.request_status === "pending") {
          // Pending requests are NOT conversations yet — they stay out of the
          // total and are surfaced separately as `requests`.
          if (t.initiated_by !== user.id) requests += 1;
          return;
        }
        total += 1;
        const isPrimary = t.user_id === user.id;
        const myRead = isPrimary ? t.last_read_at : t.other_last_read_at;
        if (!myRead || new Date(myRead) < new Date(t.last_message_at)) unread += 1;
      });
      return { unread, requests, total };
    },
  });
}

/** Backwards-compatible helper returning just the unread thread count. */
export function useUnreadMessagesCount() {
  const query = useThreadCounts();
  return { ...query, data: query.data?.unread ?? 0 };
}

/** Admin-side count of support threads awaiting a reply from the team. */
export function useAdminUnreadThreadsCount() {
  return useQuery({
    queryKey: ["admin-unread-threads"],
    refetchInterval: 30_000,
    queryFn: async (): Promise<number> => {
      const { count } = await supabase
        .from("message_threads")
        .select("id", { count: "exact", head: true })
        .neq("kind", "direct")
        .eq("last_sender", "user");
      return count ?? 0;
    },
  });
}
