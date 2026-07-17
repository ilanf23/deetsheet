ALTER TABLE public.posts ADD COLUMN approved_at timestamptz;

UPDATE public.posts SET approved_at = created_at WHERE status = 'approved' AND approved_at IS NULL;

CREATE OR REPLACE FUNCTION public.stamp_post_approved_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND NEW.approved_at IS NULL THEN
    NEW.approved_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS stamp_post_approved_at_trigger ON public.posts;
CREATE TRIGGER stamp_post_approved_at_trigger
BEFORE INSERT OR UPDATE ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.stamp_post_approved_at();

CREATE INDEX IF NOT EXISTS posts_approved_at_desc_idx ON public.posts (approved_at DESC);