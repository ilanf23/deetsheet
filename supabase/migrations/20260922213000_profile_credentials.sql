-- User-authored credentials (icon + text). The edit form kept these in
-- React state only, so Save Profile never wrote them.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS credentials jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Postgres rejects subqueries inside CHECK. Shape (icon + text) is enforced
-- in the app before save; here we only require a short JSON array.
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_credentials_shape;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_credentials_shape CHECK (
    jsonb_typeof(credentials) = 'array'
    AND jsonb_array_length(credentials) <= 30
  );

-- Public profile reads use column-level SELECT (table SELECT was revoked).
GRANT SELECT (credentials) ON public.profiles TO anon, authenticated;
GRANT UPDATE (credentials) ON public.profiles TO authenticated;

-- SQL functions expand SELECT * at creation time, so this must be replaced
-- after the new column exists or the view cannot see `credentials`.
CREATE OR REPLACE FUNCTION public.privileged_profiles()
RETURNS SETOF public.profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT p.* FROM public.profiles p
  WHERE auth.uid() IS NOT NULL
    AND (p.id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));
$$;

REVOKE ALL ON FUNCTION public.privileged_profiles() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.privileged_profiles() TO authenticated, service_role;

-- Append-only replace. WITH options are set afterwards; including them here
-- can make CREATE OR REPLACE VIEW fail on an existing view.
CREATE OR REPLACE VIEW public.profiles_private AS
SELECT id, username, bio, avatar_url, created_at, name, entity_type, sex,
       birth_month, birth_day, birth_year, city, state, country, city_born,
       education, high_school, college, degree, major, job, favorite_movie,
       reading, email_on_message, email_on_comment, email_on_follow,
       email_on_post_edit, email_top_posts, email_frequency, location_id,
       orientation, hide_age, follower_count, following_count, show_ratings,
       credentials
FROM public.privileged_profiles();

ALTER VIEW public.profiles_private SET (security_invoker = on);

GRANT SELECT ON public.profiles_private TO authenticated;
