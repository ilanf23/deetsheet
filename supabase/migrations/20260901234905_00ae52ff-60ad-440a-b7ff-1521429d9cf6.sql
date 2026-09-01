CREATE OR REPLACE FUNCTION public.admin_update_post_review_edit(
  _post_id uuid,
  _text text,
  _story text,
  _image_url text,
  _topic_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  -- Transaction-local marker: tells notify_admins_of_post_edit that this write
  -- is an admin review action, not a member editing their own post.
  PERFORM set_config('app.admin_review_write', '1', true);

  UPDATE public.posts
     SET title = _text,
         content = _text,
         story = _story,
         image_url = _image_url,
         topic_id = COALESCE(_topic_id, topic_id)
   WHERE id = _post_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_post_review_edit(uuid, text, text, text, uuid) TO authenticated;

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
  -- Admin review writes announce themselves with a transaction-local setting.
  -- They are never a "member edited their post" event.
  IF COALESCE(current_setting('app.admin_review_write', true), '') = '1' THEN
    RETURN NEW;
  END IF;

  -- Only self-edits by the post author.
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

  -- De-duplicate: a single edit session can produce more than one UPDATE.
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

  msg := COALESCE(author_label, 'A member') || ' edited their post "' || NEW.title || '" — needs re-review';

  INSERT INTO public.notifications (user_id, type, message, link, post_id)
  SELECT ur.user_id, 'post_edit', msg, '/admin/review?post=' || NEW.id::text, NEW.id
  FROM public.user_roles ur
  WHERE ur.role = 'admin';

  RETURN NEW;
END;
$$;