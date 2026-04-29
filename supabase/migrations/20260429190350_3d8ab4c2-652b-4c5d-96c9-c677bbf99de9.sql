-- Topic candidate images
CREATE TABLE public.topic_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  average_rating NUMERIC NOT NULL DEFAULT 0,
  rating_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (topic_id, url)
);

CREATE INDEX idx_topic_images_topic ON public.topic_images(topic_id);

ALTER TABLE public.topic_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Topic images viewable by everyone"
  ON public.topic_images FOR SELECT USING (true);

CREATE POLICY "Authenticated users can add topic images"
  ON public.topic_images FOR INSERT TO authenticated WITH CHECK (true);

-- Per-user ratings on topic images
CREATE TABLE public.topic_image_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_image_id UUID NOT NULL REFERENCES public.topic_images(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  value INTEGER NOT NULL CHECK (value BETWEEN 1 AND 10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (topic_image_id, user_id)
);

CREATE INDEX idx_topic_image_ratings_image ON public.topic_image_ratings(topic_image_id);
CREATE INDEX idx_topic_image_ratings_user ON public.topic_image_ratings(user_id);

ALTER TABLE public.topic_image_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Topic image ratings viewable by everyone"
  ON public.topic_image_ratings FOR SELECT USING (true);

CREATE POLICY "Users can insert own topic image ratings"
  ON public.topic_image_ratings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own topic image ratings"
  ON public.topic_image_ratings FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own topic image ratings"
  ON public.topic_image_ratings FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Recalculate aggregates when votes change
CREATE OR REPLACE FUNCTION public.update_topic_image_rating_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_image_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_image_id := OLD.topic_image_id;
  ELSE
    target_image_id := NEW.topic_image_id;
  END IF;

  UPDATE public.topic_images
  SET
    average_rating = COALESCE(
      (SELECT ROUND(AVG(value)::numeric, 1) FROM public.topic_image_ratings WHERE topic_image_id = target_image_id),
      0
    ),
    rating_count = (SELECT COUNT(*) FROM public.topic_image_ratings WHERE topic_image_id = target_image_id)
  WHERE id = target_image_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

CREATE TRIGGER trg_topic_image_ratings_stats
AFTER INSERT OR UPDATE OR DELETE ON public.topic_image_ratings
FOR EACH ROW EXECUTE FUNCTION public.update_topic_image_rating_stats();

-- Auto-promote highest-rated image (>=3 votes) to topic header
CREATE OR REPLACE FUNCTION public.auto_promote_topic_image()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  winner_url TEXT;
BEGIN
  SELECT url INTO winner_url
  FROM public.topic_images
  WHERE topic_id = NEW.topic_id
    AND rating_count >= 3
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

CREATE TRIGGER trg_topic_images_auto_promote
AFTER UPDATE OF average_rating, rating_count ON public.topic_images
FOR EACH ROW EXECUTE FUNCTION public.auto_promote_topic_image();