
-- 1. Restrict ratings SELECT to authenticated users
DROP POLICY IF EXISTS "Ratings are viewable by everyone" ON public.ratings;
CREATE POLICY "Authenticated users can view ratings"
  ON public.ratings FOR SELECT
  TO authenticated
  USING (true);

-- 2. Restrict topic_image_ratings SELECT to authenticated users
DROP POLICY IF EXISTS "Topic image ratings viewable by everyone" ON public.topic_image_ratings;
CREATE POLICY "Authenticated users can view topic image ratings"
  ON public.topic_image_ratings FOR SELECT
  TO authenticated
  USING (true);

-- 3. Add explicit admin-only INSERT/UPDATE/DELETE policies on user_roles
CREATE POLICY "Admins can insert user roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update user roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete user roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 4. Tighten topic_images INSERT policy
DROP POLICY IF EXISTS "Authenticated users can add topic images" ON public.topic_images;
CREATE POLICY "Authenticated users can add topic images"
  ON public.topic_images FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- 5. Lock down SECURITY DEFINER helper functions
-- has_role is used only inside RLS expressions (which run as definer), not via API
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated, public;

-- get_or_create_location is called via RPC by signed-in users only
REVOKE EXECUTE ON FUNCTION public.get_or_create_location(text, text, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_or_create_location(text, text, text) TO authenticated;
