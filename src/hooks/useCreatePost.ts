import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface CreatePostInput {
  topicId: string;
  topicName: string;
  title: string;
  content: string;
  anonymous?: boolean;
}

/**
 * Hook to create a new post in Supabase.
 *
 * On success it invalidates the posts-by-topic query so the feed
 * re-renders immediately, and also bumps the topic list (post counts
 * may have changed).
 */
export const useCreatePost = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreatePostInput) => {
      if (!user) throw new Error("You must be signed in to post.");

      const { data, error } = await supabase
        .from("posts")
        .insert({
          topic_id: input.topicId,
          title: input.title,
          content: input.content,
          author_id: user.id,
          score: 0,
          average_rating: 0,
          rating_count: 0,
          comment_count: 0,
        })
        .select("id")
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      // Refresh the post feed for this topic
      queryClient.invalidateQueries({
        queryKey: ["posts-by-topic", variables.topicId],
      });
      // Refresh topic list (post count changed)
      queryClient.invalidateQueries({ queryKey: ["topics"] });
      queryClient.invalidateQueries({
        queryKey: ["topic", variables.topicName],
      });
    },
  });
};
