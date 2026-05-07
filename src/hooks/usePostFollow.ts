import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Toggle and read whether the current user follows a post.
 * Backed by `post_follows` (migration 20260506120000_post_follows.sql).
 */
export const usePostFollow = (postId: string | undefined) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const followQuery = useQuery({
    queryKey: ["post-follow", postId, user?.id],
    enabled: !!postId && !!user,
    queryFn: async () => {
      if (!postId || !user) return false;
      const { data, error } = await supabase
        .from("post_follows" as never)
        .select("id")
        .eq("user_id", user.id)
        .eq("post_id", postId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async () => {
      if (!postId || !user) throw new Error("Must be signed in");

      const isFollowing = followQuery.data;
      if (isFollowing) {
        const { error } = await supabase
          .from("post_follows" as never)
          .delete()
          .eq("user_id", user.id)
          .eq("post_id", postId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("post_follows" as never)
          .insert({ user_id: user.id, post_id: postId } as never);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["post-follow", postId, user?.id],
      });
      queryClient.invalidateQueries({ queryKey: ["post-follower-count", postId] });
      queryClient.invalidateQueries({ queryKey: ["following", user?.id] });
    },
  });

  return {
    isFollowing: followQuery.data ?? false,
    isLoading: followQuery.isLoading,
    toggle: toggleMutation.mutate,
    isToggling: toggleMutation.isPending,
  };
};

/**
 * Live follower count for a single post. Reads the denormalized
 * `posts.follower_count` column maintained by the on_post_follow_change trigger.
 */
export const usePostFollowerCount = (postId: string | undefined) => {
  return useQuery({
    queryKey: ["post-follower-count", postId],
    enabled: !!postId,
    queryFn: async (): Promise<number> => {
      if (!postId) return 0;
      const { data, error } = await supabase
        .from("posts")
        .select("follower_count")
        .eq("id", postId)
        .maybeSingle();
      if (error) throw error;
      return (data as { follower_count?: number } | null)?.follower_count ?? 0;
    },
  });
};
