import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Toggle and read whether the current user follows another user.
 * Backed by `user_follows` (migration 20260410120100_user_follows.sql).
 *
 * `targetUserId` is the user being followed.
 */
export const useUserFollow = (targetUserId: string | undefined) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isSelf = !!user && user.id === targetUserId;

  const followQuery = useQuery({
    queryKey: ["user-follow", targetUserId, user?.id],
    enabled: !!targetUserId && !!user && !isSelf,
    queryFn: async () => {
      if (!targetUserId || !user) return false;
      const { data, error } = await supabase
        .from("user_follows" as never)
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", targetUserId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async () => {
      if (!targetUserId || !user) throw new Error("Must be signed in");
      if (isSelf) throw new Error("Cannot follow yourself");

      const isFollowing = followQuery.data;
      if (isFollowing) {
        const { error } = await supabase
          .from("user_follows" as never)
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", targetUserId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_follows" as never)
          .insert({ follower_id: user.id, following_id: targetUserId } as never);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["user-follow", targetUserId, user?.id],
      });
      queryClient.invalidateQueries({ queryKey: ["profile-follow-counts", targetUserId] });
      queryClient.invalidateQueries({ queryKey: ["profile-follow-counts", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["following", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["followers", targetUserId] });
    },
  });

  return {
    isFollowing: followQuery.data ?? false,
    isLoading: followQuery.isLoading,
    isSelf,
    toggle: toggleMutation.mutate,
    isToggling: toggleMutation.isPending,
  };
};

/**
 * Reads denormalized follower/following counts for a profile.
 */
export const useProfileFollowCounts = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["profile-follow-counts", userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return { followerCount: 0, followingCount: 0 };
      const { data, error } = await supabase
        .from("profiles")
        .select("follower_count, following_count")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw error;
      const row = data as { follower_count?: number; following_count?: number } | null;
      return {
        followerCount: row?.follower_count ?? 0,
        followingCount: row?.following_count ?? 0,
      };
    },
  });
};
