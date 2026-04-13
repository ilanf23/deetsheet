
-- New tables
CREATE TABLE IF NOT EXISTS public.comment_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (comment_id, user_id)
);
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comment likes viewable by everyone" ON public.comment_likes FOR SELECT USING (true);
CREATE POLICY "Users can insert own comment likes" ON public.comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comment likes" ON public.comment_likes FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.user_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL,
  following_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (follower_id, following_id)
);
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User follows viewable by everyone" ON public.user_follows FOR SELECT USING (true);
CREATE POLICY "Users can insert own follows" ON public.user_follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can delete own follows" ON public.user_follows FOR DELETE USING (auth.uid() = follower_id);

CREATE TABLE IF NOT EXISTS public.topic_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  topic_id uuid NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, topic_id)
);
ALTER TABLE public.topic_follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Topic follows viewable by everyone" ON public.topic_follows FOR SELECT USING (true);
CREATE POLICY "Users can insert own topic follows" ON public.topic_follows FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own topic follows" ON public.topic_follows FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.email_captures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  source text NOT NULL DEFAULT 'topic_sidebar',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.email_captures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert email captures" ON public.email_captures FOR INSERT WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.post_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  topic_id uuid NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.post_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can select own drafts" ON public.post_drafts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own drafts" ON public.post_drafts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own drafts" ON public.post_drafts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own drafts" ON public.post_drafts FOR DELETE USING (auth.uid() = user_id);

-- Seed topics
INSERT INTO public.topics (id, slug, name, category_name, description, post_count) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'parent',        'Parent',        'Life',   'What are the most important details of being a Parent?',          1),
  ('a0000000-0000-0000-0000-000000000002', 'college',       'College',       'Life',   'What are the most important details of being in College?',        1),
  ('a0000000-0000-0000-0000-000000000003', 'love',          'Love',          'Life',   'What are the most important details of Love?',                    1),
  ('a0000000-0000-0000-0000-000000000004', 'waiter',        'Waiter',        'Jobs',   'What are the most important details of being a Waiter?',          1),
  ('a0000000-0000-0000-0000-000000000005', 'doctor',        'Doctor',        'Jobs',   'What are the most important details of being a Doctor?',          1),
  ('a0000000-0000-0000-0000-000000000006', 'accountant',    'Accountant',    'Jobs',   'What are the most important details of being an Accountant?',     1),
  ('a0000000-0000-0000-0000-000000000007', 'chicago',       'Chicago',       'Cities', 'What are the most important details of living in Chicago?',       1),
  ('a0000000-0000-0000-0000-000000000008', 'new-york-city', 'New York City', 'Cities', 'What are the most important details of living in New York City?',  1),
  ('a0000000-0000-0000-0000-000000000009', 'los-angeles',   'Los Angeles',   'Cities', 'What are the most important details of living in Los Angeles?',    1)
ON CONFLICT (slug) DO UPDATE SET
  category_name = EXCLUDED.category_name,
  description = EXCLUDED.description,
  post_count = EXCLUDED.post_count;

-- Seed posts using existing user as author
INSERT INTO public.posts (id, topic_id, title, content, author_id, score)
SELECT v.id::uuid, t.id, t.description, t.description, 'b1000000-0000-0000-0000-000000000001'::uuid, 100
FROM (VALUES
  ('b0000000-0000-0000-0000-000000000001', 'parent'),
  ('b0000000-0000-0000-0000-000000000002', 'college'),
  ('b0000000-0000-0000-0000-000000000003', 'love'),
  ('b0000000-0000-0000-0000-000000000004', 'waiter'),
  ('b0000000-0000-0000-0000-000000000005', 'doctor'),
  ('b0000000-0000-0000-0000-000000000006', 'accountant'),
  ('b0000000-0000-0000-0000-000000000007', 'chicago'),
  ('b0000000-0000-0000-0000-000000000008', 'new-york-city'),
  ('b0000000-0000-0000-0000-000000000009', 'los-angeles')
) AS v(id, slug)
JOIN public.topics t ON t.slug = v.slug
ON CONFLICT (id) DO NOTHING;
