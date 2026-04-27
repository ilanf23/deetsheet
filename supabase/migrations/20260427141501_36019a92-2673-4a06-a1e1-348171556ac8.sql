ALTER TABLE public.comments
  ADD COLUMN parent_comment_id uuid NULL
  REFERENCES public.comments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_comments_parent_comment_id
  ON public.comments(parent_comment_id);

CREATE INDEX IF NOT EXISTS idx_comments_post_id_created_at
  ON public.comments(post_id, created_at);