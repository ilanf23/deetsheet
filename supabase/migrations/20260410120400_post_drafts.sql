-- Post Drafts: private in-progress posts for each author
-- Unblocks SOW section 2.10 (Post Creation) — draft save + resume flow

CREATE TABLE public.post_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
  title TEXT,
  content TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.post_drafts ENABLE ROW LEVEL SECURITY;

-- Drafts are private — only the author can read/write
CREATE POLICY "Users can read their own drafts" ON public.post_drafts
  FOR SELECT TO authenticated USING (auth.uid() = author_id);

CREATE POLICY "Users can create their own drafts" ON public.post_drafts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own drafts" ON public.post_drafts
  FOR UPDATE TO authenticated USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own drafts" ON public.post_drafts
  FOR DELETE TO authenticated USING (auth.uid() = author_id);

CREATE POLICY "Admins can read any draft" ON public.post_drafts
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can delete any draft" ON public.post_drafts
  FOR DELETE USING (public.is_admin());

-- Auto-update updated_at on any row modification
CREATE OR REPLACE FUNCTION public.touch_post_draft_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_post_draft_update
  BEFORE UPDATE ON public.post_drafts
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_post_draft_updated_at();

CREATE INDEX idx_post_drafts_author_id ON public.post_drafts(author_id);
CREATE INDEX idx_post_drafts_topic_id ON public.post_drafts(topic_id);
CREATE INDEX idx_post_drafts_updated_at ON public.post_drafts(updated_at DESC);
