CREATE OR REPLACE FUNCTION public.count_changed_words(_old text, _new text)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  old_words text[];
  new_words text[];
  changed int;
BEGIN
  old_words := regexp_split_to_array(btrim(regexp_replace(lower(coalesce(_old, '')), '[^a-z0-9]+', ' ', 'g')), '\s+');
  new_words := regexp_split_to_array(btrim(regexp_replace(lower(coalesce(_new, '')), '[^a-z0-9]+', ' ', 'g')), '\s+');

  SELECT count(*) INTO changed FROM (
    SELECT unnest(old_words) AS w
    EXCEPT ALL
    SELECT unnest(new_words)
  ) a WHERE a.w <> '';

  SELECT changed + count(*) INTO changed FROM (
    SELECT unnest(new_words) AS w
    EXCEPT ALL
    SELECT unnest(old_words)
  ) b WHERE b.w <> '';

  RETURN coalesce(changed, 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_admins_of_post_edit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  changed int;
  editor uuid := auth.uid();
  author_label text;
  msg text;
BEGIN
  -- Only self-edits by the post author; admin review edits are excluded.
  IF editor IS NULL OR NEW.author_id IS NULL OR editor <> NEW.author_id THEN
    RETURN NEW;
  END IF;

  IF OLD.status NOT IN ('approved', 'pending', 'rejected') THEN
    RETURN NEW;
  END IF;

  changed :=
    public.count_changed_words(OLD.title, NEW.title) +
    public.count_changed_words(OLD.content, NEW.content) +
    public.count_changed_words(OLD.story, NEW.story);

  IF changed < 4 THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(NULLIF(btrim(p.name), ''), NULLIF(btrim(p.username), ''), 'A member')
    INTO author_label FROM public.profiles p WHERE p.id = NEW.author_id;

  msg := COALESCE(author_label, 'A member') || ' edited their post "' || NEW.title || '" — needs re-review';

  INSERT INTO public.notifications (user_id, type, message, link, post_id)
  SELECT ur.user_id, 'post_edit', msg, '/admin/review?post=' || NEW.id::text, NEW.id
  FROM public.user_roles ur
  WHERE ur.role = 'admin';

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_admins_of_post_edit ON public.posts;
CREATE TRIGGER trg_notify_admins_of_post_edit
AFTER UPDATE ON public.posts
FOR EACH ROW
WHEN (OLD.title IS DISTINCT FROM NEW.title
   OR OLD.content IS DISTINCT FROM NEW.content
   OR OLD.story IS DISTINCT FROM NEW.story)
EXECUTE FUNCTION public.notify_admins_of_post_edit();