CREATE TABLE public.post_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  edited_by uuid,
  edited_at timestamptz NOT NULL DEFAULT now(),
  title text,
  content text,
  story text,
  image_url text,
  is_anonymous boolean,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX post_revisions_post_id_edited_at_idx ON public.post_revisions (post_id, edited_at DESC);

GRANT SELECT ON public.post_revisions TO authenticated;
GRANT ALL ON public.post_revisions TO service_role;

ALTER TABLE public.post_revisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and moderators can read all post revisions"
ON public.post_revisions FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Authors can read revisions of their own posts"
ON public.post_revisions FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.posts p
  WHERE p.id = post_revisions.post_id AND p.author_id = auth.uid()
));

CREATE OR REPLACE FUNCTION public.capture_post_revision()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (OLD.title IS DISTINCT FROM NEW.title)
     OR (OLD.content IS DISTINCT FROM NEW.content)
     OR (OLD.story IS DISTINCT FROM NEW.story)
     OR (OLD.image_url IS DISTINCT FROM NEW.image_url)
     OR (OLD.is_anonymous IS DISTINCT FROM NEW.is_anonymous)
  THEN
    INSERT INTO public.post_revisions (post_id, edited_by, title, content, story, image_url, is_anonymous)
    VALUES (OLD.id, auth.uid(), OLD.title, OLD.content, OLD.story, OLD.image_url, OLD.is_anonymous);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS capture_post_revision_trg ON public.posts;
CREATE TRIGGER capture_post_revision_trg
AFTER UPDATE ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.capture_post_revision();