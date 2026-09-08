ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS sort_at timestamptz
  GENERATED ALWAYS AS (COALESCE(approved_at, created_at)) STORED;

CREATE INDEX IF NOT EXISTS posts_sort_at_desc_idx
  ON public.posts (sort_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS posts_topic_sort_at_desc_idx
  ON public.posts (topic_id, sort_at DESC, id DESC);