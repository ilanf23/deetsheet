import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "@/contexts/LocationContext";

interface CreatePostInput {
  topicId: string;
  topicName: string;
  title: string;
  content: string;
  anonymous?: boolean;
  image?: File | null;
}

export const useCreatePost = () => {
  const { user } = useAuth();
  const { location } = useLocation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreatePostInput) => {
      if (!user) throw new Error("You must be signed in to post.");

      // Default location: use author's saved location if available, otherwise national.
      let locationId: string | null = null;
      let isNational = false;

      if (location?.id) {
        locationId = location.id;
      } else if (location?.city && location?.state) {
        const { data, error } = await supabase.rpc("get_or_create_location", {
          _city: location.city,
          _state: location.state,
          _country: "US",
        });
        if (!error) locationId = (data as string) ?? null;
        if (!locationId) isNational = true;
      } else {
        isNational = true;
      }

      // Upload image if provided
      let imageUrl: string | null = null;
      if (input.image) {
        const ext = input.image.name.split(".").pop() || "jpg";
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("post-images")
          .upload(path, input.image, { upsert: false });
        if (uploadError) throw uploadError;
        const { data: pub } = supabase.storage.from("post-images").getPublicUrl(path);
        imageUrl = pub.publicUrl;
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
          is_anonymous: input.anonymous ?? false,
          image_url: imageUrl,
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
    },
  });
};
