-- Email Captures: anonymous email submissions from conversion surfaces
-- Unblocks SOW section 2.8 (Conversion) — email capture modals, signup teasers

CREATE TABLE public.email_captures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  source TEXT,
  referrer TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(email, source)
);

ALTER TABLE public.email_captures ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) can submit their email — this is a public funnel
CREATE POLICY "Anyone can submit email" ON public.email_captures
  FOR INSERT TO public WITH CHECK (true);

-- Only admins can read captures (emails are PII)
CREATE POLICY "Admins can read captures" ON public.email_captures
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can delete captures" ON public.email_captures
  FOR DELETE USING (public.is_admin());

CREATE INDEX idx_email_captures_created_at ON public.email_captures(created_at DESC);
CREATE INDEX idx_email_captures_email ON public.email_captures(email);
CREATE INDEX idx_email_captures_source ON public.email_captures(source);
