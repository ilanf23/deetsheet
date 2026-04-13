
ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS category_name text NOT NULL DEFAULT 'Life';
ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS post_count integer NOT NULL DEFAULT 0;
