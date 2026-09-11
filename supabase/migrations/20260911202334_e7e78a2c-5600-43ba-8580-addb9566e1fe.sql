ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS show_ratings boolean NOT NULL DEFAULT true;

GRANT SELECT (show_ratings) ON public.profiles TO anon, authenticated;
GRANT UPDATE (show_ratings) ON public.profiles TO authenticated;