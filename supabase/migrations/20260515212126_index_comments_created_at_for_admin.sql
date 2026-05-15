CREATE INDEX IF NOT EXISTS idx_comments_created_at_desc
ON public.comments (created_at DESC);
