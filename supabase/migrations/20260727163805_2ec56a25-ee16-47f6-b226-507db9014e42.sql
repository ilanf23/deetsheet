-- 1. posts.updated_at
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE OR REPLACE FUNCTION public.touch_posts_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_posts_touch_updated_at ON public.posts;
CREATE TRIGGER trg_posts_touch_updated_at
BEFORE UPDATE ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.touch_posts_updated_at();

-- 2. topic image sync: fire on any update, and backfill
DROP TRIGGER IF EXISTS trg_sync_post_image_to_topic_images ON public.posts;
CREATE TRIGGER trg_sync_post_image_to_topic_images
AFTER INSERT OR UPDATE ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.sync_post_image_to_topic_images();

INSERT INTO public.topic_images (topic_id, url)
SELECT DISTINCT p.topic_id, p.image_url
FROM public.posts p
WHERE p.status = 'approved'
  AND p.topic_id IS NOT NULL
  AND p.image_url IS NOT NULL
  AND length(btrim(p.image_url)) > 0
ON CONFLICT (topic_id, url) DO NOTHING;

-- 3. notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  message text NOT NULL,
  link text,
  post_id uuid,
  thread_id uuid,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications (user_id, read_at, created_at DESC);

-- helper: build a post deep link
CREATE OR REPLACE FUNCTION public.build_post_link(_post_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT '/topic/' || t.name || '/post/' ||
         nullif(btrim(regexp_replace(lower(p.title), '[^a-z0-9]+', '-', 'g'), '-'), '') ||
         '-' || left(p.id::text, 8)
  FROM public.posts p
  JOIN public.topics t ON t.id = p.topic_id
  WHERE p.id = _post_id
$$;

-- (a) comment on your post
CREATE OR REPLACE FUNCTION public.notify_post_author_of_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  post_author uuid;
  post_title text;
  commenter text;
BEGIN
  SELECT author_id, title INTO post_author, post_title FROM public.posts WHERE id = NEW.post_id;
  IF post_author IS NULL OR post_author = NEW.author_id THEN
    RETURN NEW;
  END IF;

  IF NEW.is_anonymous THEN
    commenter := 'Someone';
  ELSE
    SELECT COALESCE(NULLIF(btrim(pr.name), ''), NULLIF(btrim(pr.username), ''), 'Someone')
    INTO commenter FROM public.profiles pr WHERE pr.id = NEW.author_id;
    commenter := COALESCE(commenter, 'Someone');
  END IF;

  INSERT INTO public.notifications (user_id, type, message, link, post_id)
  VALUES (
    post_author,
    'comment',
    commenter || ' commented on your post ' || post_title,
    public.build_post_link(NEW.post_id),
    NEW.post_id
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_comment ON public.comments;
CREATE TRIGGER trg_notify_comment
AFTER INSERT ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.notify_post_author_of_comment();

-- (b) admin message received
CREATE OR REPLACE FUNCTION public.notify_user_of_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recipient uuid;
BEGIN
  IF NEW.sender_role = 'user' THEN
    RETURN NEW;
  END IF;

  SELECT user_id INTO recipient FROM public.message_threads WHERE id = NEW.thread_id;
  IF recipient IS NULL OR recipient = NEW.sender_id THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (user_id, type, message, link, thread_id)
  VALUES (recipient, 'message', 'You received a message from DeetSheet', '/inbox/' || NEW.thread_id::text, NEW.thread_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_message ON public.messages;
CREATE TRIGGER trg_notify_message
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.notify_user_of_message();

-- (c) post status change
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
          CASE WHEN NEW.status = 'approved' THEN public.build_post_link(NEW.id) ELSE '/profile' END,
          NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_post_status ON public.posts;
CREATE TRIGGER trg_notify_post_status
AFTER UPDATE OF status ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.notify_author_of_post_status();