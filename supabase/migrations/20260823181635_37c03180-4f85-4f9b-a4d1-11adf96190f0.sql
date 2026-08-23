-- 1) Follow tables: restrict read access to signed-in users only
DROP POLICY IF EXISTS "Post follows are viewable by everyone" ON public.post_follows;
CREATE POLICY "Post follows viewable by authenticated users"
  ON public.post_follows FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Topic follows viewable by everyone" ON public.topic_follows;
CREATE POLICY "Topic follows viewable by authenticated users"
  ON public.topic_follows FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "User follows viewable by everyone" ON public.user_follows;
CREATE POLICY "User follows viewable by authenticated users"
  ON public.user_follows FOR SELECT TO authenticated USING (true);

REVOKE SELECT ON public.post_follows FROM anon;
REVOKE SELECT ON public.topic_follows FROM anon;
REVOKE SELECT ON public.user_follows FROM anon;
GRANT SELECT ON public.post_follows TO authenticated;
GRANT SELECT ON public.topic_follows TO authenticated;
GRANT SELECT ON public.user_follows TO authenticated;

-- 2) Replace SECURITY DEFINER views with SECURITY INVOKER views over
--    security definer functions that perform their own access checks.
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

CREATE OR REPLACE FUNCTION public.privileged_posts()
RETURNS SETOF public.posts
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT p.* FROM public.posts p
  WHERE auth.uid() IS NOT NULL
    AND ((p.author_id = auth.uid() AND p.deleted_at IS NULL)
         OR public.has_role(auth.uid(), 'admin'::app_role));
$$;

CREATE OR REPLACE FUNCTION public.privileged_comments()
RETURNS SETOF public.comments
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT c.* FROM public.comments c
  WHERE auth.uid() IS NOT NULL
    AND (c.author_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));
$$;

REVOKE ALL ON FUNCTION public.privileged_profiles() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.privileged_posts() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.privileged_comments() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.privileged_profiles() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.privileged_posts() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.privileged_comments() TO authenticated, service_role;

DROP VIEW IF EXISTS public.profiles_private;
CREATE VIEW public.profiles_private WITH (security_invoker = true) AS
SELECT id, username, bio, avatar_url, created_at, name, entity_type, sex,
       birth_month, birth_day, birth_year, city, state, country, city_born,
       education, high_school, college, degree, major, job, favorite_movie,
       reading, email_on_message, email_on_comment, email_on_follow,
       email_on_post_edit, email_top_posts, email_frequency, location_id,
       orientation, hide_age, follower_count, following_count
FROM public.privileged_profiles();

DROP VIEW IF EXISTS public.posts_privileged;
CREATE VIEW public.posts_privileged WITH (security_invoker = true) AS
SELECT id, title, content, topic_id, author_id, score, comment_count, created_at,
       average_rating, rating_count, location_id, is_national, image_url,
       is_anonymous, status, story, follower_count, approved_at, updated_at,
       public_author_id, deleted_at, deleted_by, deleted_reason, needs_author_edit
FROM public.privileged_posts();

DROP VIEW IF EXISTS public.comments_privileged;
CREATE VIEW public.comments_privileged WITH (security_invoker = true) AS
SELECT id, post_id, author_id, content, created_at, parent_comment_id,
       like_count, is_anonymous, public_author_id
FROM public.privileged_comments();

REVOKE ALL ON public.profiles_private FROM anon;
REVOKE ALL ON public.posts_privileged FROM anon;
REVOKE ALL ON public.comments_privileged FROM anon;
GRANT SELECT ON public.profiles_private TO authenticated;
GRANT SELECT ON public.posts_privileged TO authenticated;
GRANT SELECT ON public.comments_privileged TO authenticated;