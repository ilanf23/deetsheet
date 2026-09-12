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

/**
 * Shape shared by the admin inbox page and the sidebar badge. Both must agree
 * on what "needs the team's attention" means, so the rule lives here.
 */
export type AdminThreadLike = {
  kind?: string | null;
  last_sender?: string | null;
  last_message_at?: string | null;
  admin_read_at?: string | null;
  hidden_for_other_at?: string | null;
};

/**
 * A support thread needs a reply from the team while the member spoke last and
 * no admin has opened it since that message.
 *
 * Member-to-member chats (`kind = 'direct'`) never need an admin reply, and a
 * thread the team removed from its inbox is out of scope too.
 */
export function adminNeedsContact(t: AdminThreadLike): boolean {
  if (t.kind === "direct") return false;
  if (t.hidden_for_other_at) return false;
  if (t.last_sender !== "user") return false;
  if (!t.last_message_at) return false;
  return !t.admin_read_at || new Date(t.admin_read_at) < new Date(t.last_message_at);
}

/**
 * Admin-side count of support threads awaiting a reply from the team.
 * Uses the exact same predicate as the "Needs contact" tab.
 */
export function useAdminUnreadThreadsCount() {
  return useQuery({
    queryKey: ["admin-unread-threads"],
    refetchInterval: 30_000,
    queryFn: async (): Promise<number> => {
      const { data } = await supabase
        .from("message_threads")
        .select("id,kind,last_sender,last_message_at,admin_read_at,hidden_for_other_at")
        .neq("kind", "direct")
        .eq("last_sender", "user");
      return (data ?? []).filter((t: any) => adminNeedsContact(t)).length;
    },
  });
}


/** Admin-side count of contact-form messages nobody has marked as read yet. */
export function useAdminUnreadContactCount() {
  return useQuery({
    queryKey: ["admin-unread-contact"],
    refetchInterval: 30_000,
    queryFn: async (): Promise<number> => {
      const { count } = await supabase
        .from("contact_messages")
        .select("id", { count: "exact", head: true })
        .eq("is_read", false);
      return count ?? 0;
    },
  });
}


