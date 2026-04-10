-- Comment Likes: one like per user per comment (toggle behavior)
-- Unblocks SOW section 2.4 (Post Engagement) — heart/like interactions on comments

CREATE TABLE public.comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comment likes are viewable by everyone" ON public.comment_likes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like comments" ON public.comment_likes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike their own likes" ON public.comment_likes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Admin override (matches pattern from 20260311000000_admin_support.sql)
CREATE POLICY "Admins can delete any comment like" ON public.comment_likes
  FOR DELETE USING (public.is_admin());

CREATE INDEX idx_comment_likes_comment_id ON public.comment_likes(comment_id);
CREATE INDEX idx_comment_likes_user_id ON public.comment_likes(user_id);

-- Denormalized count on comments for fast reads
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS like_count INTEGER NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.update_comment_like_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_comment_id UUID;
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
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

CREATE TRIGGER on_comment_like_change
  AFTER INSERT OR DELETE ON public.comment_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_comment_like_count();
