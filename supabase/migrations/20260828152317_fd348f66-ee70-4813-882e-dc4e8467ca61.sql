CREATE OR REPLACE FUNCTION public.update_topic_post_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_topic_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_topic_id := OLD.topic_id;
  ELSE
    target_topic_id := NEW.topic_id;
  END IF;

  UPDATE public.topics
  SET post_count = (
    SELECT COUNT(*) FROM public.posts
    WHERE topic_id = target_topic_id
      AND status = 'approved'
      AND deleted_at IS NULL
  )
  WHERE id = target_topic_id;

  IF TG_OP = 'UPDATE' AND OLD.topic_id IS DISTINCT FROM NEW.topic_id THEN
    UPDATE public.topics
    SET post_count = (
      SELECT COUNT(*) FROM public.posts
      WHERE topic_id = OLD.topic_id
        AND status = 'approved'
        AND deleted_at IS NULL
    )
    WHERE id = OLD.topic_id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

UPDATE public.topics t
SET post_count = COALESCE(c.cnt, 0)
FROM (
  SELECT tp.id, (
    SELECT COUNT(*) FROM public.posts p
    WHERE p.topic_id = tp.id AND p.status = 'approved' AND p.deleted_at IS NULL
  ) AS cnt
  FROM public.topics tp
) c
WHERE t.id = c.id AND t.post_count IS DISTINCT FROM COALESCE(c.cnt, 0);