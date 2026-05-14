
-- 1. TOPICS: add created_by, policies, post_count trigger
ALTER TABLE public.topics
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE POLICY "Authenticated users can create topics"
ON public.topics FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND (created_by IS NULL OR created_by = auth.uid()));

CREATE POLICY "Admins can update topics"
ON public.topics FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete topics"
ON public.topics FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

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
  SET post_count = (SELECT COUNT(*) FROM public.posts WHERE topic_id = target_topic_id)
  WHERE id = target_topic_id;

  -- Handle topic change on UPDATE
  IF TG_OP = 'UPDATE' AND OLD.topic_id IS DISTINCT FROM NEW.topic_id THEN
    UPDATE public.topics
    SET post_count = (SELECT COUNT(*) FROM public.posts WHERE topic_id = OLD.topic_id)
    WHERE id = OLD.topic_id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS posts_update_topic_count ON public.posts;
CREATE TRIGGER posts_update_topic_count
AFTER INSERT OR UPDATE OR DELETE ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.update_topic_post_count();

-- Backfill topic post counts
UPDATE public.topics t
SET post_count = COALESCE((SELECT COUNT(*) FROM public.posts p WHERE p.topic_id = t.id), 0);

-- 2. COMMENTS: like_count column + trigger from comment_likes
ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS like_count integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.update_comment_like_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_comment_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_comment_id := OLD.comment_id;
  ELSE
    target_comment_id := NEW.comment_id;
  END IF;

  UPDATE public.comments
  SET like_count = (SELECT COUNT(*) FROM public.comment_likes WHERE comment_id = target_comment_id)
  WHERE id = target_comment_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS comment_likes_update_count ON public.comment_likes;
CREATE TRIGGER comment_likes_update_count
AFTER INSERT OR DELETE ON public.comment_likes
FOR EACH ROW EXECUTE FUNCTION public.update_comment_like_count();

-- Backfill
UPDATE public.comments c
SET like_count = COALESCE((SELECT COUNT(*) FROM public.comment_likes cl WHERE cl.comment_id = c.id), 0);

-- 3. POSTS: score from votes
CREATE OR REPLACE FUNCTION public.update_post_score()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_post_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_post_id := OLD.post_id;
  ELSE
    target_post_id := NEW.post_id;
  END IF;

  UPDATE public.posts
  SET score = COALESCE((SELECT SUM(value)::int FROM public.votes WHERE post_id = target_post_id), 0)
  WHERE id = target_post_id;

  IF TG_OP = 'UPDATE' AND OLD.post_id IS DISTINCT FROM NEW.post_id THEN
    UPDATE public.posts
    SET score = COALESCE((SELECT SUM(value)::int FROM public.votes WHERE post_id = OLD.post_id), 0)
    WHERE id = OLD.post_id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS votes_update_post_score ON public.votes;
CREATE TRIGGER votes_update_post_score
AFTER INSERT OR UPDATE OR DELETE ON public.votes
FOR EACH ROW EXECUTE FUNCTION public.update_post_score();

UPDATE public.posts p
SET score = COALESCE((SELECT SUM(value)::int FROM public.votes v WHERE v.post_id = p.id), 0);

-- 4. TOPIC IMAGES: admin moderation policies
CREATE POLICY "Admins can update topic images"
ON public.topic_images FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete topic images"
ON public.topic_images FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
