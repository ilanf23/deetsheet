-- Add category and creator tracking to topics
ALTER TABLE public.topics ADD COLUMN category_name TEXT;
ALTER TABLE public.topics ADD COLUMN created_by UUID REFERENCES auth.users(id);

-- Allow authenticated users to create topics
CREATE POLICY "Authenticated users can create topics"
  ON public.topics FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

CREATE INDEX idx_topics_created_by ON public.topics(created_by);

-- Drop the suggestion system (no longer needed)
DROP TABLE IF EXISTS public.topic_suggestions;
