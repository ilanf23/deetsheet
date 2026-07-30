CREATE TABLE public.review_reasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('edit','reject')),
  label text NOT NULL,
  detail text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.review_reasons TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.review_reasons TO authenticated;
GRANT ALL ON public.review_reasons TO service_role;

ALTER TABLE public.review_reasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read review reasons"
ON public.review_reasons FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert review reasons"
ON public.review_reasons FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update review reasons"
ON public.review_reasons FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete review reasons"
ON public.review_reasons FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER review_reasons_updated_at
BEFORE UPDATE ON public.review_reasons
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();