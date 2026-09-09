CREATE OR REPLACE FUNCTION public.is_post_author(_post_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.posts p
    WHERE p.id = _post_id AND p.author_id = auth.uid()
  )
$$;

REVOKE ALL ON FUNCTION public.is_post_author(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_post_author(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_post_author(uuid) TO service_role;

DROP POLICY IF EXISTS "Authors can read revisions of their own posts" ON public.post_revisions;
CREATE POLICY "Authors can read revisions of their own posts"
ON public.post_revisions
FOR SELECT
TO authenticated
USING (public.is_post_author(post_id));