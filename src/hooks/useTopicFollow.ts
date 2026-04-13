import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Hook to check whether the current user follows a topic, and to
 * toggle that follow state. Uses the `topic_follows` table created
 * in Sprint 0 migration 20260410120200_topic_follows.sql.
 */
export const useTopicFollow = (topicId: string | undefined) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const followQuery = useQuery({
    queryKey: ["topic-follow", topicId, user?.id],
    enabled: !!topicId && !!user,
    queryFn: async () => {
      if (!topicId || !user) return false;
      const { data, error } = await supabase
        .from("topic_follows" as any)
        .select("id")
        .eq("user_id", user.id)
        .eq("topic_id", topicId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async () => {
      if (!topicId || !user) throw new Error("Must be signed in");

      const isFollowing = followQuery.data;
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from("topic_follows" as any)
          .delete()
          .eq("user_id", user.id)
          .eq("topic_id", topicId);
        if (error) throw error;
      } else {
        // Follow
        const { error } = await supabase
          .from("topic_follows" as any)
          .insert({ user_id: user.id, topic_id: topicId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["topic-follow", topicId, user?.id],
      });
    },
  });

  return {
    isFollowing: followQuery.data ?? false,
    isLoading: followQuery.isLoading,
    toggle: toggleMutation.mutate,
    isToggling: toggleMutation.isPending,
  };
};
