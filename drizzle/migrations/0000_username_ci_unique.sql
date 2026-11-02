CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_key ON public.profiles (lower(username)) WHERE username IS NOT NULL;

CREATE OR REPLACE FUNCTION public.is_username_taken(_username text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE lower(username) = lower(trim(_username))
      AND (auth.uid() IS NULL OR id <> auth.uid())
  )
$$;
REVOKE ALL ON FUNCTION public.is_username_taken(text) FROM public;
GRANT EXECUTE ON FUNCTION public.is_username_taken(text) TO anon, authenticated;