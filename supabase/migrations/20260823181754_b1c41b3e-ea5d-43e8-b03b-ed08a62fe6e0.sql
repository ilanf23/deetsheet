DROP VIEW IF EXISTS public.posts_privileged;
DROP FUNCTION IF EXISTS public.privileged_posts();

CREATE FUNCTION public.privileged_posts()
RETURNS TABLE(
  id uuid, title text, content text, topic_id uuid, author_id uuid, score integer,
  comment_count integer, created_at timestamptz, average_rating numeric,
  rating_count integer, location_id uuid, is_national boolean, image_url text,
  is_anonymous boolean, status text, story text, follower_count integer,
  approved_at timestamptz, updated_at timestamptz, public_author_id uuid,
  deleted_at timestamptz, deleted_by uuid, deleted_reason text,
  needs_author_edit boolean, topic_name text, topic_slug text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT p.id, p.title, p.content, p.topic_id, p.author_id, p.score, p.comment_count,
         p.created_at, p.average_rating, p.rating_count, p.location_id, p.is_national,
         p.image_url, p.is_anonymous, p.status, p.story, p.follower_count, p.approved_at,
         p.updated_at, p.public_author_id, p.deleted_at, p.deleted_by, p.deleted_reason,
         p.needs_author_edit, t.name, t.slug
  FROM public.posts p
  LEFT JOIN public.topics t ON t.id = p.topic_id
  WHERE auth.uid() IS NOT NULL
    AND ((p.author_id = auth.uid() AND p.deleted_at IS NULL)
         OR public.has_role(auth.uid(), 'admin'::app_role));
$$;

REVOKE ALL ON FUNCTION public.privileged_posts() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.privileged_posts() TO authenticated, service_role;

CREATE VIEW public.posts_privileged WITH (security_invoker = true) AS
SELECT id, title, content, topic_id, author_id, score, comment_count, created_at,
       average_rating, rating_count, location_id, is_national, image_url,
       is_anonymous, status, story, follower_count, approved_at, updated_at,
       public_author_id, deleted_at, deleted_by, deleted_reason, needs_author_edit,
       topic_name, topic_slug
FROM public.privileged_posts();

REVOKE ALL ON public.posts_privileged FROM anon;
GRANT SELECT ON public.posts_privileged TO authenticated;