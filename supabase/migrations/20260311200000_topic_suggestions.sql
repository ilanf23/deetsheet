CREATE TABLE public.topic_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category_name TEXT,
  description TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.topic_suggestions ENABLE ROW LEVEL SECURITY;

-- Everyone can view suggestions
CREATE POLICY "Suggestions are viewable by everyone"
  ON public.topic_suggestions FOR SELECT USING (true);

-- Logged-in users can create suggestions
CREATE POLICY "Logged in users can suggest topics"
  ON public.topic_suggestions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can update (approve/reject) and delete
CREATE POLICY "Admins can update suggestions"
  ON public.topic_suggestions FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete suggestions"
  ON public.topic_suggestions FOR DELETE USING (public.is_admin());

CREATE INDEX idx_topic_suggestions_status ON public.topic_suggestions(status);
CREATE INDEX idx_topic_suggestions_user_id ON public.topic_suggestions(user_id);
