-- Topic Follows: user follows a topic for their personalized feed
-- Unblocks SOW section 2.3 (Topic Pages) — "Follow Topic" button and personalized feeds

CREATE TABLE public.topic_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, topic_id)
);

ALTER TABLE public.topic_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Topic follows are viewable by everyone" ON public.topic_follows
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can follow topics" ON public.topic_follows
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unfollow topics" ON public.topic_follows
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any topic follow" ON public.topic_follows
  FOR DELETE USING (public.is_admin());

CREATE INDEX idx_topic_follows_user_id ON public.topic_follows(user_id);
CREATE INDEX idx_topic_follows_topic_id ON public.topic_follows(topic_id);

-- Denormalized count on topics
ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS follower_count INTEGER NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.update_topic_follow_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.topics SET follower_count = follower_count + 1 WHERE id = NEW.topic_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.topics SET follower_count = GREATEST(follower_count - 1, 0) WHERE id = OLD.topic_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER on_topic_follow_change
  AFTER INSERT OR DELETE ON public.topic_follows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_topic_follow_count();
