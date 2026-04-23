-- Trigger function to keep posts.comment_count in sync with comments table
CREATE OR REPLACE FUNCTION public.update_post_comment_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_post_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_post_id := OLD.post_id;
  ELSE
    target_post_id := NEW.post_id;
  END IF;

  UPDATE public.posts
  SET comment_count = (SELECT COUNT(*) FROM public.comments WHERE post_id = target_post_id)
  WHERE id = target_post_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS comments_update_count ON public.comments;
CREATE TRIGGER comments_update_count
AFTER INSERT OR DELETE ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.update_post_comment_count();

-- Backfill all existing posts
UPDATE public.posts p
SET comment_count = sub.cnt
FROM (
  SELECT post_id, COUNT(*) AS cnt
  FROM public.comments
  GROUP BY post_id
) sub
WHERE p.id = sub.post_id;