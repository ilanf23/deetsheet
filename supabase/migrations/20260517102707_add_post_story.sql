-- Add optional long-form "story" column to posts.
-- The CreatePostDialog captures a comment/story narrative that was previously
-- discarded — this column persists it alongside title/content.
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS story text;
