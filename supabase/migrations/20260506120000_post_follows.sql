-- Post Follows: user follows a post to be notified of activity / surface in feed
-- Mirrors topic_follows (20260410120200) and user_follows (20260410120100).

CREATE TABLE public.post_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

ALTER TABLE public.post_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Post follows are viewable by everyone" ON public.post_follows
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can follow posts" ON public.post_follows
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unfollow posts" ON public.post_follows
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any post follow" ON public.post_follows
  FOR DELETE USING (public.is_admin());

CREATE INDEX idx_post_follows_user_id ON public.post_follows(user_id);
CREATE INDEX idx_post_follows_post_id ON public.post_follows(post_id);

-- Denormalized count on posts
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS follower_count INTEGER NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.update_post_follow_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET follower_count = follower_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET follower_count = GREATEST(follower_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER on_post_follow_change
  AFTER INSERT OR DELETE ON public.post_follows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_post_follow_count();
