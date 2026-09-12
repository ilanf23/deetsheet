DROP POLICY IF EXISTS "Authenticated users can view ratings" ON public.ratings;

CREATE POLICY "Ratings visible to owner, admins, or when shared"
ON public.ratings
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'moderator'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = ratings.user_id AND p.show_ratings
  )
);