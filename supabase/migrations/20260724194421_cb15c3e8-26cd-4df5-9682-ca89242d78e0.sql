-- Function: sync a post's image into topic_images
CREATE OR REPLACE FUNCTION public.sync_post_image_to_topic_images()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.image_url IS NOT NULL
     AND length(btrim(NEW.image_url)) > 0
     AND NEW.topic_id IS NOT NULL
     AND COALESCE(NEW.status, 'approved') = 'approved'
  THEN
    INSERT INTO public.topic_images (topic_id, url)
    VALUES (NEW.topic_id, NEW.image_url)
    ON CONFLICT (topic_id, url) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_post_image_to_topic_images ON public.posts;
CREATE TRIGGER trg_sync_post_image_to_topic_images
AFTER INSERT OR UPDATE OF image_url, status, topic_id ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.sync_post_image_to_topic_images();

-- Backfill: all approved posts with images
INSERT INTO public.topic_images (topic_id, url)
SELECT DISTINCT p.topic_id, p.image_url
FROM public.posts p
WHERE p.image_url IS NOT NULL
  AND length(btrim(p.image_url)) > 0
  AND p.topic_id IS NOT NULL
  AND COALESCE(p.status, 'approved') = 'approved'
ON CONFLICT (topic_id, url) DO NOTHING;