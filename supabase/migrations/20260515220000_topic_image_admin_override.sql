-- Admin controls for topic candidate images.
--
-- Adds:
--   - topic_images.is_approved        : hide bad seeded candidates from the public ranking dialog
--   - topic_images.uploaded_by        : audit trail for admin-uploaded images
--   - topics.pinned_image_id          : admin override for the topic header image
--   - admin RLS policies on topic_images (update/delete)
--   - auto_promote_topic_image trigger now skips topics that have a pinned image

ALTER TABLE public.topic_images
  ADD COLUMN IF NOT EXISTS is_approved BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS uploaded_by UUID;

CREATE INDEX IF NOT EXISTS idx_topic_images_topic_approved
  ON public.topic_images(topic_id, is_approved);

ALTER TABLE public.topics
  ADD COLUMN IF NOT EXISTS pinned_image_id UUID
    REFERENCES public.topic_images(id) ON DELETE SET NULL;

-- Admins can edit and remove any candidate image.
CREATE POLICY "Admins can update topic images"
  ON public.topic_images FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete topic images"
  ON public.topic_images FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Replace the auto-promote trigger so it respects an admin pin.
CREATE OR REPLACE FUNCTION public.auto_promote_topic_image()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  winner_url TEXT;
  pinned UUID;
BEGIN
  SELECT pinned_image_id INTO pinned
  FROM public.topics
  WHERE id = NEW.topic_id;

  -- Admin has pinned a specific image; do not let the community vote override it.
  IF pinned IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT url INTO winner_url
  FROM public.topic_images
  WHERE topic_id = NEW.topic_id
    AND rating_count >= 3
    AND is_approved = true
  ORDER BY average_rating DESC, rating_count DESC, created_at ASC
  LIMIT 1;

  IF winner_url IS NOT NULL THEN
    UPDATE public.topics
    SET image_url = winner_url
    WHERE id = NEW.topic_id
      AND (image_url IS DISTINCT FROM winner_url);
  END IF;

  RETURN NEW;
END;
$$;
