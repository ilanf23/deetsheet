CREATE OR REPLACE FUNCTION public.mark_post_needs_author_edit(_post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _author uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  -- Transaction-local marker: tells clear_needs_author_edit that THIS write is
  -- the review dialog setting the flag, so it must not be cleared again.
  PERFORM set_config('app.marking_needs_edit', '1', true);

  UPDATE public.posts
     SET needs_author_edit = true
   WHERE id = _post_id
     AND status = 'pending'
     AND deleted_at IS NULL
  RETURNING author_id INTO _author;

  -- No notification here on purpose: the suggestion thread's own message
  -- notification (notify_user_of_message) is the single in-app ping.
END;
$$;

CREATE OR REPLACE FUNCTION public.clear_needs_author_edit()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status IN ('approved', 'rejected') THEN
    NEW.needs_author_edit := false;
    RETURN NEW;
  END IF;

  -- Any save performed by the post's author clears the flag — including an
  -- author who also happens to be an admin. The single exception is the write
  -- issued by mark_post_needs_author_edit itself, which announces itself with a
  -- transaction-local setting so it can never clear the flag it is setting.
  IF OLD.needs_author_edit
     AND auth.uid() IS NOT NULL
     AND auth.uid() = NEW.author_id
     AND COALESCE(current_setting('app.marking_needs_edit', true), '') <> '1'
  THEN
    NEW.needs_author_edit := false;
  END IF;

  RETURN NEW;
END;
$$;