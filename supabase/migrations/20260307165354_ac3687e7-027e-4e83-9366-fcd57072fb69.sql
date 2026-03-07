
-- 1. Profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'username');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Topics table
CREATE TABLE public.topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Topics are viewable by everyone"
  ON public.topics FOR SELECT USING (true);

-- 3. Posts table
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Posts are viewable by everyone"
  ON public.posts FOR SELECT USING (true);

CREATE POLICY "Logged in users can create posts"
  ON public.posts FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own posts"
  ON public.posts FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own posts"
  ON public.posts FOR DELETE USING (auth.uid() = author_id);

-- 4. Comments table
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are viewable by everyone"
  ON public.comments FOR SELECT USING (true);

CREATE POLICY "Logged in users can create comments"
  ON public.comments FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own comments"
  ON public.comments FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own comments"
  ON public.comments FOR DELETE USING (auth.uid() = author_id);

-- 5. Votes table (one vote per user per post)
CREATE TABLE public.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  value SMALLINT NOT NULL CHECK (value IN (-1, 1)),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Votes are viewable by everyone"
  ON public.votes FOR SELECT USING (true);

CREATE POLICY "Logged in users can vote"
  ON public.votes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes"
  ON public.votes FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes"
  ON public.votes FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_posts_topic_id ON public.posts(topic_id);
CREATE INDEX idx_posts_author_id ON public.posts(author_id);
CREATE INDEX idx_posts_score ON public.posts(score DESC);
CREATE INDEX idx_comments_post_id ON public.comments(post_id);
CREATE INDEX idx_votes_post_id ON public.votes(post_id);
CREATE INDEX idx_votes_user_id ON public.votes(user_id);
