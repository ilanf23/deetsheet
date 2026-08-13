-- 1. Soft-delete columns
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid,
  ADD COLUMN IF NOT EXISTS deleted_reason text;

CREATE INDEX IF NOT EXISTS posts_deleted_at_idx ON public.posts (deleted_at);

-- 2. Hide deleted posts from every non-admin read path
DROP POLICY IF EXISTS "Approved posts viewable by everyone" ON public.posts;
CREATE POLICY "Approved posts viewable by everyone"
ON public.posts
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    deleted_at IS NULL
    AND (
      status = 'approved'
      OR (auth.uid() IS NOT NULL AND auth.uid() = author_id)
    )
  )
);

-- 3. Authors can no longer edit or delete a deleted post
DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts;
CREATE POLICY "Users can update their own posts"
ON public.posts
FOR UPDATE
USING (auth.uid() = author_id AND deleted_at IS NULL)
WITH CHECK (auth.uid() = author_id AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Users can delete their own posts" ON public.posts;
CREATE POLICY "Users can delete their own posts"
ON public.posts
FOR DELETE
USING (auth.uid() = author_id AND deleted_at IS NULL);

-- 4. Privileged view: authors only ever see their live rows; admins see all,
--    including deleted ones (that is the admin archive source).
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
    deleted_reason
FROM posts p
WHERE (author_id = auth.uid() AND deleted_at IS NULL)
   OR has_role(auth.uid(), 'admin'::app_role);

-- 5. Rejected posts must never link to an edit screen
CREATE OR REPLACE FUNCTION public.notify_author_of_post_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  msg text;
BEGIN
  IF NEW.author_id IS NULL OR OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  msg := CASE NEW.status
    WHEN 'approved' THEN 'Your post "' || NEW.title || '" was approved'
    WHEN 'pending' THEN 'Your post "' || NEW.title || '" is pending review'
    WHEN 'rejected' THEN 'Your post "' || NEW.title || '" was not approved'
    ELSE 'Your post "' || NEW.title || '" status changed to ' || NEW.status
  END;

  INSERT INTO public.notifications (user_id, type, message, link, post_id)
  VALUES (NEW.author_id, 'post_status', msg,
          CASE
            WHEN NEW.status = 'approved' THEN public.build_post_link(NEW.id)
            WHEN NEW.status = 'pending' THEN '/profile?edit=' || NEW.id::text
            ELSE '/profile'
          END,
          NEW.id);
  RETURN NEW;
END;
$$;

-- 6. Rejection = soft delete, enforced server-side
CREATE OR REPLACE FUNCTION public.soft_delete_rejected_post()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'rejected' AND NEW.deleted_at IS NULL THEN
    NEW.deleted_at := now();
    NEW.deleted_by := COALESCE(NEW.deleted_by, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS posts_soft_delete_rejected ON public.posts;
CREATE TRIGGER posts_soft_delete_rejected
BEFORE INSERT OR UPDATE ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.soft_delete_rejected_post();

-- 7. Backfill: existing rejected posts are treated as deleted
UPDATE public.posts
SET deleted_at = COALESCE(updated_at, now())
WHERE status = 'rejected' AND deleted_at IS NULL;