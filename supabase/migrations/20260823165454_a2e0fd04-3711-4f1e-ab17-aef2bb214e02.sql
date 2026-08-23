-- 1. Column
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS needs_author_edit boolean NOT NULL DEFAULT false;

-- 2. Expose it on the privileged view (author sees own rows, admin sees all)
CREATE OR REPLACE VIEW public.posts_privileged AS
SELECT id,
    title,
    content,
    topic_id,
    author_id,
    score,
    comment_count,
    created_at,
    average_rating,
    rating_count,
    location_id,
    is_national,
    image_url,
    is_anonymous,
    status,
    story,
    follower_count,
    approved_at,
    updated_at,
    public_author_id,
    deleted_at,
    deleted_by,
    deleted_reason,
    needs_author_edit
FROM posts p
WHERE (author_id = auth.uid() AND deleted_at IS NULL)
   OR has_role(auth.uid(), 'admin'::app_role);

REVOKE ALL ON public.posts_privileged FROM anon;
GRANT SELECT ON public.posts_privileged TO authenticated;

-- 3. Auto-clear rules. Runs BEFORE UPDATE, alongside the updated_at touch.
--    Author edit  -> auth.uid() = author_id and caller is not an admin  -> clear
--    Admin edit   -> auth.uid() <> author_id (review dialog)            -> keep
--    approved/rejected                                                  -> clear
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

  -- Only an edit performed by the author themself clears the flag.
  IF OLD.needs_author_edit
     AND auth.uid() IS NOT NULL
     AND auth.uid() = NEW.author_id
     AND NOT public.has_role(auth.uid(), 'admin'::app_role)
     AND (OLD.title IS DISTINCT FROM NEW.title
          OR OLD.content IS DISTINCT FROM NEW.content
          OR OLD.story IS DISTINCT FROM NEW.story
          OR OLD.image_url IS DISTINCT FROM NEW.image_url
          OR OLD.topic_id IS DISTINCT FROM NEW.topic_id)
  THEN
    NEW.needs_author_edit := false;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_posts_clear_needs_author_edit ON public.posts;
CREATE TRIGGER trg_posts_clear_needs_author_edit
BEFORE UPDATE ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.clear_needs_author_edit();

-- 4. Only writer path: admin-only security-definer RPC used by the suggest flow.
CREATE OR REPLACE FUNCTION public.mark_post_needs_author_edit(_post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _author uuid;
  _title text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  UPDATE public.posts
     SET needs_author_edit = true
   WHERE id = _post_id
     AND status = 'pending'
     AND deleted_at IS NULL
  RETURNING author_id, title INTO _author, _title;

  IF _author IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, message, link, post_id)
    VALUES (_author, 'post_status',
            'Your post "' || _title || '" needs editing before approval',
            '/profile?edit=' || _post_id::text,
            _post_id);
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_post_needs_author_edit(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.mark_post_needs_author_edit(uuid) TO authenticated;