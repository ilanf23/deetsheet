CREATE OR REPLACE FUNCTION public.notify_admins_of_post_edit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  changed int;
  editor uuid := auth.uid();
  author_label text;
  msg text;
BEGIN
  IF COALESCE(current_setting('app.admin_review_write', true), '') = '1' THEN
    RETURN NEW;
  END IF;

  IF editor IS NULL OR NEW.author_id IS NULL OR editor <> NEW.author_id THEN
    RETURN NEW;
  END IF;

  IF public.has_role(editor, 'admin'::app_role)
     OR public.has_role(editor, 'moderator'::app_role) THEN
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

  IF EXISTS (
    SELECT 1 FROM public.notifications n
    WHERE n.post_id = NEW.id
      AND n.type = 'post_edit'
      AND n.created_at > now() - interval '5 minutes'
  ) THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(NULLIF(btrim(p.name), ''), NULLIF(btrim(p.username), ''), 'A member')
    INTO author_label FROM public.profiles p WHERE p.id = NEW.author_id;

  msg := COALESCE(author_label, 'A member') || ' edited their post "' || NEW.title || '", needs re-review';

  INSERT INTO public.notifications (user_id, type, message, link, post_id)
  SELECT ur.user_id, 'post_edit', msg, '/admin/review?post=' || NEW.id::text, NEW.id
  FROM public.user_roles ur
  WHERE ur.role = 'admin'
    AND ur.user_id <> editor;

  RETURN NEW;
END;
$$;

DELETE FROM public.notifications n
USING public.posts p
WHERE n.type = 'post_edit'
  AND n.post_id = p.id
  AND n.user_id = p.author_id;