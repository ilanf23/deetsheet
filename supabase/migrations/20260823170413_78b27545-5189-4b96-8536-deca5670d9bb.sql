CREATE OR REPLACE FUNCTION public.mark_post_needs_author_edit(_post_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _author uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  UPDATE public.posts
     SET needs_author_edit = true
   WHERE id = _post_id
     AND status = 'pending'
     AND deleted_at IS NULL
  RETURNING author_id INTO _author;

  -- No notification here on purpose: the suggestion thread's own message
  -- notification (notify_user_of_message) is the single in-app ping.
END;
$function$;