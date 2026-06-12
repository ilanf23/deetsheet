CREATE TABLE IF NOT EXISTS public.post_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

GRANT SELECT ON public.post_follows TO anon;
GRANT SELECT, INSERT, DELETE ON public.post_follows TO authenticated;
GRANT ALL ON public.post_follows TO service_role;

ALTER TABLE public.post_follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Post follows are viewable by everyone" ON public.post_follows;
DROP POLICY IF EXISTS "Authenticated users can follow posts" ON public.post_follows;
DROP POLICY IF EXISTS "Users can unfollow posts" ON public.post_follows;
DROP POLICY IF EXISTS "Admins can delete any post follow" ON public.post_follows;

CREATE POLICY "Post follows are viewable by everyone" ON public.post_follows
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can follow posts" ON public.post_follows
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unfollow posts" ON public.post_follows
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any post follow" ON public.post_follows
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_post_follows_user_id ON public.post_follows(user_id);
CREATE INDEX IF NOT EXISTS idx_post_follows_post_id ON public.post_follows(post_id);

GRANT SELECT ON public.user_follows TO anon;
GRANT SELECT, INSERT, DELETE ON public.user_follows TO authenticated;
GRANT ALL ON public.user_follows TO service_role;

GRANT SELECT ON public.topic_follows TO anon;
GRANT SELECT, INSERT, DELETE ON public.topic_follows TO authenticated;
GRANT ALL ON public.topic_follows TO service_role;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS follower_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS following_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS follower_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS follower_count INTEGER NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.recalculate_profile_follow_counts(_profile_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET
    follower_count = (
      SELECT COUNT(*)::int
      FROM public.user_follows
      WHERE following_id = _profile_id
    ),
    following_count = (
      (SELECT COUNT(*)::int FROM public.user_follows WHERE follower_id = _profile_id) +
      (SELECT COUNT(*)::int FROM public.topic_follows WHERE user_id = _profile_id) +
      (SELECT COUNT(*)::int FROM public.post_follows WHERE user_id = _profile_id)
    )
  WHERE id = _profile_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_user_follow_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.recalculate_profile_follow_counts(NEW.follower_id);
    PERFORM public.recalculate_profile_follow_counts(NEW.following_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.recalculate_profile_follow_counts(OLD.follower_id);
    PERFORM public.recalculate_profile_follow_counts(OLD.following_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_topic_follow_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.topics
    SET follower_count = (SELECT COUNT(*)::int FROM public.topic_follows WHERE topic_id = NEW.topic_id)
    WHERE id = NEW.topic_id;
    PERFORM public.recalculate_profile_follow_counts(NEW.user_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.topics
    SET follower_count = (SELECT COUNT(*)::int FROM public.topic_follows WHERE topic_id = OLD.topic_id)
    WHERE id = OLD.topic_id;
    PERFORM public.recalculate_profile_follow_counts(OLD.user_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_post_follow_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts
    SET follower_count = (SELECT COUNT(*)::int FROM public.post_follows WHERE post_id = NEW.post_id)
    WHERE id = NEW.post_id;
    PERFORM public.recalculate_profile_follow_counts(NEW.user_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts
    SET follower_count = (SELECT COUNT(*)::int FROM public.post_follows WHERE post_id = OLD.post_id)
    WHERE id = OLD.post_id;
    PERFORM public.recalculate_profile_follow_counts(OLD.user_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_user_follow_change ON public.user_follows;
DROP TRIGGER IF EXISTS on_topic_follow_change ON public.topic_follows;
DROP TRIGGER IF EXISTS on_post_follow_change ON public.post_follows;

CREATE TRIGGER on_user_follow_change
  AFTER INSERT OR DELETE ON public.user_follows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_follow_counts();

CREATE TRIGGER on_topic_follow_change
  AFTER INSERT OR DELETE ON public.topic_follows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_topic_follow_counts();

CREATE TRIGGER on_post_follow_change
  AFTER INSERT OR DELETE ON public.post_follows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_post_follow_counts();

UPDATE public.profiles p
SET
  follower_count = COALESCE(f.count, 0),
  following_count = COALESCE(uf.count, 0) + COALESCE(tf.count, 0) + COALESCE(pf.count, 0)
FROM public.profiles base
LEFT JOIN (
  SELECT following_id, COUNT(*)::int AS count
  FROM public.user_follows
  GROUP BY following_id
) f ON f.following_id = base.id
LEFT JOIN (
  SELECT follower_id, COUNT(*)::int AS count
  FROM public.user_follows
  GROUP BY follower_id
) uf ON uf.follower_id = base.id
LEFT JOIN (
  SELECT user_id, COUNT(*)::int AS count
  FROM public.topic_follows
  GROUP BY user_id
) tf ON tf.user_id = base.id
LEFT JOIN (
  SELECT user_id, COUNT(*)::int AS count
  FROM public.post_follows
  GROUP BY user_id
) pf ON pf.user_id = base.id
WHERE p.id = base.id;

UPDATE public.topics t
SET follower_count = COALESCE(f.count, 0)
FROM public.topics base
LEFT JOIN (
  SELECT topic_id, COUNT(*)::int AS count
  FROM public.topic_follows
  GROUP BY topic_id
) f ON f.topic_id = base.id
WHERE t.id = base.id;

UPDATE public.posts p
SET follower_count = COALESCE(f.count, 0)
FROM public.posts base
LEFT JOIN (
  SELECT post_id, COUNT(*)::int AS count
  FROM public.post_follows
  GROUP BY post_id
) f ON f.post_id = base.id
WHERE p.id = base.id;