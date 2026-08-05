-- 1. Harden function search_path
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq;

-- 2. Legacy archive tables: no app access at all
REVOKE ALL ON public.comments_archive_fredbrewer_20260610 FROM anon, authenticated;
REVOKE ALL ON public.posts_archive_fredbrewer_20260610 FROM anon, authenticated;
REVOKE ALL ON public.ratings_archive_fredbrewer_20260610 FROM anon, authenticated;
GRANT ALL ON public.comments_archive_fredbrewer_20260610 TO service_role;
GRANT ALL ON public.posts_archive_fredbrewer_20260610 TO service_role;
GRANT ALL ON public.ratings_archive_fredbrewer_20260610 TO service_role;

-- 3. Anonymity: public author reference that is NULL for anonymous content
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS public_author_id uuid
  GENERATED ALWAYS AS (CASE WHEN is_anonymous THEN NULL ELSE author_id END) STORED;

ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS public_author_id uuid
  GENERATED ALWAYS AS (CASE WHEN is_anonymous THEN NULL ELSE author_id END) STORED;

ALTER TABLE public.posts
  ADD CONSTRAINT posts_public_author_id_profiles_fkey
  FOREIGN KEY (public_author_id) REFERENCES public.profiles(id);

ALTER TABLE public.comments
  ADD CONSTRAINT comments_public_author_id_profiles_fkey
  FOREIGN KEY (public_author_id) REFERENCES public.profiles(id);

CREATE INDEX IF NOT EXISTS posts_public_author_id_idx ON public.posts (public_author_id);
CREATE INDEX IF NOT EXISTS comments_public_author_id_idx ON public.comments (public_author_id);

-- 4. Column-level read grants: hide author_id from anon/authenticated
DO $$
DECLARE
  cols text;
BEGIN
  FOR cols IN SELECT 'posts' UNION ALL SELECT 'comments' LOOP
    EXECUTE format('REVOKE SELECT ON public.%I FROM anon, authenticated', cols);
    EXECUTE (
      SELECT format('GRANT SELECT (%s) ON public.%I TO anon, authenticated',
                    string_agg(quote_ident(column_name), ', '), cols)
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = cols AND column_name <> 'author_id'
    );
  END LOOP;
END $$;

-- 5. Profiles: hide intimate fields + email prefs from public reads
DO $$
BEGIN
  EXECUTE 'REVOKE SELECT ON public.profiles FROM anon, authenticated';
  EXECUTE (
    SELECT format('GRANT SELECT (%s) ON public.profiles TO anon, authenticated',
                  string_agg(quote_ident(column_name), ', '))
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles'
      AND column_name NOT IN (
        'sex','orientation','birth_month','birth_day','birth_year',
        'email_on_message','email_on_comment','email_on_follow',
        'email_on_post_edit','email_top_posts','email_frequency'
      )
  );
END $$;

-- 6. Privileged views (owner or admin only) for full-fidelity reads
CREATE OR REPLACE VIEW public.profiles_private
WITH (security_invoker = false) AS
SELECT p.*
FROM public.profiles p
WHERE p.id = auth.uid() OR public.has_role(auth.uid(), 'admin');

CREATE OR REPLACE VIEW public.posts_privileged
WITH (security_invoker = false) AS
SELECT p.*
FROM public.posts p
WHERE p.author_id = auth.uid() OR public.has_role(auth.uid(), 'admin');

CREATE OR REPLACE VIEW public.comments_privileged
WITH (security_invoker = false) AS
SELECT c.*
FROM public.comments c
WHERE c.author_id = auth.uid() OR public.has_role(auth.uid(), 'admin');

REVOKE ALL ON public.profiles_private FROM anon;
REVOKE ALL ON public.posts_privileged FROM anon;
REVOKE ALL ON public.comments_privileged FROM anon;
GRANT SELECT ON public.profiles_private TO authenticated;
GRANT SELECT ON public.posts_privileged TO authenticated;
GRANT SELECT ON public.comments_privileged TO authenticated;