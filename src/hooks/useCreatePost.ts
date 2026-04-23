import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "@/contexts/LocationContext";
import type { LocationChoice } from "@/components/CreatePostDialog";

interface CreatePostInput {
  topicId: string;
  topicName: string;
  title: string;
  content: string;
  anonymous?: boolean;
  /** Location choice from the post dialog. Defaults to author's location when omitted. */
  locationChoice?: LocationChoice;
}

/**
 * Hook to create a new post in Supabase.
 *
 * Resolves the post's location_id / is_national flag from the user's
 * `LocationChoice`:
 *   - "author"   → author's saved profile location (national if none)
 *   - "national" → location_id null, is_national true
 *   - "custom"   → resolve city/state via get_or_create_location
 *
 * On success it invalidates the posts-by-topic query so the feed
 * re-renders immediately and bumps the topic + home feed caches.
 */
export const useCreatePost = () => {
  const { user } = useAuth();
  const { location } = useLocation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreatePostInput) => {
      if (!user) throw new Error("You must be signed in to post.");

      // Resolve location_id / is_national from the choice.
      let locationId: string | null = null;
      let isNational = false;

      const choice: LocationChoice = input.locationChoice ?? { kind: "author" };
      if (choice.kind === "national") {
        isNational = true;
      } else if (choice.kind === "custom") {
        const { data, error } = await supabase.rpc("get_or_create_location", {
          _city: choice.city,
          _state: choice.state.toUpperCase(),
          _country: "US",
        });
        if (error) throw error;
        locationId = (data as string) ?? null;
        if (!locationId) isNational = true;
      } else {
        // "author"
        if (location?.id) {
          locationId = location.id;
        } else if (location?.city && location?.state) {
          // Anonymous-style location (no DB row yet) — resolve & save.
          const { data, error } = await supabase.rpc("get_or_create_location", {
            _city: location.city,
            _state: location.state,
            _country: "US",
          });
          if (!error) locationId = (data as string) ?? null;
          if (!locationId) isNational = true;
        } else {
          // No saved location → fall back to national.
          isNational = true;
        }
      }

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
          location_id: locationId,
          is_national: isNational,
        })
        .select("id")
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["posts-by-topic", variables.topicId],
      });
      queryClient.invalidateQueries({ queryKey: ["topics"] });
      queryClient.invalidateQueries({
        queryKey: ["topic", variables.topicName],
      });
      queryClient.invalidateQueries({ queryKey: ["home-feed"] });
    },
  });
};
