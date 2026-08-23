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

  -- Any save performed by the author on their own post clears the flag.
  -- Admin writes (review dialog, admin edit dialog) run under the admin's JWT,
  -- so auth.uid() <> author_id and the flag survives.
  IF OLD.needs_author_edit
     AND auth.uid() IS NOT NULL
     AND auth.uid() = NEW.author_id
     AND NOT public.has_role(auth.uid(), 'admin'::app_role)
  THEN
    NEW.needs_author_edit := false;
  END IF;

  RETURN NEW;
END;
$$;