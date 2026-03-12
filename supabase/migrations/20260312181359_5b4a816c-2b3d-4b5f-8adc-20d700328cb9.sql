
-- Ratings table: each user rates a post 1-10
CREATE TABLE public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  value NUMERIC(3,1) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ratings are viewable by everyone" ON public.ratings
  FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated users can insert own ratings" ON public.ratings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ratings" ON public.ratings
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ratings" ON public.ratings
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Add average_rating and rating_count columns to posts for denormalized fast reads
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS average_rating NUMERIC(3,1) NOT NULL DEFAULT 0;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS rating_count INTEGER NOT NULL DEFAULT 0;

-- Function to recalculate post rating stats
CREATE OR REPLACE FUNCTION public.update_post_rating_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
  SET
    average_rating = COALESCE((SELECT ROUND(AVG(value)::numeric, 1) FROM public.ratings WHERE post_id = target_post_id), 0),
    rating_count = (SELECT COUNT(*) FROM public.ratings WHERE post_id = target_post_id)
  WHERE id = target_post_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Trigger to auto-update stats on rating changes
CREATE TRIGGER on_rating_change
  AFTER INSERT OR UPDATE OR DELETE ON public.ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_post_rating_stats();
