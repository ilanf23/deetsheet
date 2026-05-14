-- Add status column to posts for admin review workflow
ALTER TABLE public.posts
ADD COLUMN status text NOT NULL DEFAULT 'pending';

ALTER TABLE public.posts
ADD CONSTRAINT posts_status_check CHECK (status IN ('pending', 'approved', 'rejected'));

-- Backfill: all existing posts are approved (already live)
UPDATE public.posts SET status = 'approved' WHERE status = 'pending';

-- Replace the public SELECT policy: only approved posts are publicly visible.
-- Authors can see their own pending/rejected posts; admins can see everything.
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;

CREATE POLICY "Approved posts viewable by everyone"
ON public.posts
FOR SELECT
USING (
  status = 'approved'
  OR has_role(auth.uid(), 'admin'::app_role)
  OR (auth.uid() IS NOT NULL AND auth.uid() = author_id)
);

CREATE INDEX IF NOT EXISTS idx_posts_status ON public.posts(status);