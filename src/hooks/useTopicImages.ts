import { useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { buildTopicImageUrls } from "@/lib/topicImageQueries";

export interface TopicImageRow {
  id: string;
  url: string;
  averageRating: number;
  ratingCount: number;
  yourRating: number | null;
}

interface UseTopicImagesArgs {
  topicId: string | undefined;
  topicName: string;
  categoryName: string;
}

/**
 * Fetch candidate images for a topic + the current user's ratings.
 * On first access (no rows yet) we lazy-seed ~12 topic-relevant URLs.
 */
export const useTopicImages = ({ topicId, topicName, categoryName }: UseTopicImagesArgs) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id ?? null;

  const query = useQuery({
    queryKey: ["topic-images", topicId, userId],
    enabled: !!topicId,
    queryFn: async (): Promise<TopicImageRow[]> => {
      if (!topicId) return [];

      const { data: existing, error } = await supabase
        .from("topic_images")
        .select("id, url, average_rating, rating_count")
        .eq("topic_id", topicId)
        .eq("is_approved", true)
        .order("average_rating", { ascending: false })
        .order("created_at", { ascending: true });

      if (error) throw error;

      let rows = (existing ?? []) as Array<{
        id: string;
        url: string;
        average_rating: number;
        rating_count: number;
      }>;

      // Detect rows seeded from now-deprecated image hosts so we can re-seed.
      const isBrokenUrl = (u: string) =>
        u.includes("source.unsplash.com");
      const allBroken =
        rows.length > 0 && rows.every((r) => isBrokenUrl(r.url));

      // Lazy seed (or re-seed) when there are no rows, or every row points to
      // a known-broken host. Anonymous visitors fall back to the empty state.
      if ((rows.length === 0 || allBroken) && userId) {
        const urls = buildTopicImageUrls(topicName, categoryName);
        const { data: inserted, error: insertErr } = await supabase
          .from("topic_images")
          .insert(urls.map((url) => ({ topic_id: topicId, url })))
          .select("id, url, average_rating, rating_count");
        if (insertErr) throw insertErr;
        rows = [
          ...rows.filter((r) => !isBrokenUrl(r.url)),
          ...((inserted ?? []) as typeof rows),
        ];
      }

      let yourRatings: Record<string, number> = {};
      if (userId && rows.length > 0) {
        const { data: ratings } = await supabase
          .from("topic_image_ratings")
          .select("topic_image_id, value")
          .eq("user_id", userId)
          .in(
            "topic_image_id",
            rows.map((r) => r.id)
          );
        yourRatings = Object.fromEntries(
          ((ratings ?? []) as Array<{ topic_image_id: string; value: number }>).map((r) => [
            r.topic_image_id,
            r.value,
          ])
        );
      }

      return rows.map((r) => ({
        id: r.id,
        url: r.url,
        averageRating: Number(r.average_rating ?? 0),
        ratingCount: r.rating_count ?? 0,
        yourRating: yourRatings[r.id] ?? null,
      }));
    },
  });

  const rate = useMutation({
    mutationFn: async ({ imageId, value }: { imageId: string; value: number }) => {
      if (!userId) throw new Error("Sign in to rate images");
      const { error } = await supabase
        .from("topic_image_ratings")
        .upsert(
          { topic_image_id: imageId, user_id: userId, value },
          { onConflict: "topic_image_id,user_id" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["topic-images", topicId] });
      queryClient.invalidateQueries({ queryKey: ["topic", topicName] });
      queryClient.invalidateQueries({ queryKey: ["topics"] });
    },
  });

  const clearRate = useMutation({
    mutationFn: async ({ imageId }: { imageId: string }) => {
      if (!userId) throw new Error("Sign in to rate images");
      const { error } = await supabase
        .from("topic_image_ratings")
        .delete()
        .eq("topic_image_id", imageId)
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["topic-images", topicId] });
      queryClient.invalidateQueries({ queryKey: ["topic", topicName] });
      queryClient.invalidateQueries({ queryKey: ["topics"] });
    },
  });

  return { ...query, rate, clearRate };
};
