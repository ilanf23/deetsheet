
-- Add status column with check constraint
ALTER TABLE public.topics
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';

ALTER TABLE public.topics
  DROP CONSTRAINT IF EXISTS topics_status_check;
ALTER TABLE public.topics
  ADD CONSTRAINT topics_status_check
  CHECK (status IN ('pending', 'approved', 'rejected'));

-- Backfill: everything that already exists is approved
UPDATE public.topics SET status = 'approved' WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_topics_status ON public.topics(status);

-- Replace the public SELECT policy with one that hides non-approved topics
-- from anyone other than admins or the topic's creator.
DROP POLICY IF EXISTS "Topics are viewable by everyone" ON public.topics;

CREATE POLICY "Approved topics viewable by everyone"
ON public.topics FOR SELECT
USING (
  status = 'approved'
  OR public.has_role(auth.uid(), 'admin')
  OR (auth.uid() IS NOT NULL AND created_by = auth.uid())
);
