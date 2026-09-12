-- Task 6: stop self-edit / admin-edit "needs re-review" notifications.
--
-- The `post_edit` notification exists so the team can re-check a *member's*
-- edit to their own post. It was firing for admins too, and sent the alert to
-- every admin — including the person who just made the edit. Fred (admin +
-- author) therefore got "Fred Brewer edited their post … needs re-review"
-- every time he touched one of his own posts.
--
-- Rule from now on:
--   1. Only a regular member's self-edit generates the re-review alert.
--      Admins and moderators editing their own posts don't need a second pair
--      of eyes, so nothing is sent.
--   2. The editor is never one of the recipients, whoever they are.
--   3. Admin/moderator edits of *someone else's* post were already silent
--      (editor <> author) and stay that way.

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

  -- Rule 1: staff editing their own post needs no re-review.
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

  -- Rule 2: never notify the editor about their own action.
  INSERT INTO public.notifications (user_id, type, message, link, post_id)
  SELECT ur.user_id, 'post_edit', msg, '/admin/review?post=' || NEW.id::text, NEW.id
  FROM public.user_roles ur
  WHERE ur.role = 'admin'
    AND ur.user_id <> editor;

  RETURN NEW;
END;
$$;

-- Clean up the self-notifications that already landed in admins' bells: any
-- `post_edit` alert delivered to the author of the post it is about.
DELETE FROM public.notifications n
USING public.posts p
WHERE n.type = 'post_edit'
  AND n.post_id = p.id
  AND n.user_id = p.author_id;
