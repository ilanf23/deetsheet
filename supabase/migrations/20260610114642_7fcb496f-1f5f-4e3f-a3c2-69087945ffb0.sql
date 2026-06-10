-- Archive + delete fredbrewer's AI-seed posts (2026-04-24 batch)
-- Safety: wrapped in a DO block with explicit assertions that RAISE EXCEPTION on mismatch,
-- which rolls back the entire migration transaction.

-- 1. Archive tables (admin-only, mirror live schema)
CREATE TABLE IF NOT EXISTS public.posts_archive_fredbrewer_20260610 (LIKE public.posts INCLUDING ALL);
CREATE TABLE IF NOT EXISTS public.ratings_archive_fredbrewer_20260610 (LIKE public.ratings INCLUDING ALL);
CREATE TABLE IF NOT EXISTS public.comments_archive_fredbrewer_20260610 (LIKE public.comments INCLUDING ALL);

GRANT ALL ON public.posts_archive_fredbrewer_20260610 TO service_role;
GRANT ALL ON public.ratings_archive_fredbrewer_20260610 TO service_role;
GRANT ALL ON public.comments_archive_fredbrewer_20260610 TO service_role;

ALTER TABLE public.posts_archive_fredbrewer_20260610 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings_archive_fredbrewer_20260610 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments_archive_fredbrewer_20260610 ENABLE ROW LEVEL SECURITY;
-- No policies = locked. Only service_role (and admins via SQL) can access.

-- 2. Copy-then-delete with assertions
DO $$
DECLARE
  v_seed_count int;
  v_archived_posts int;
  v_archived_ratings int;
  v_remaining_fred int;
  v_author uuid := '6d711ce0-f0fd-4a42-b052-a2b72f43aea1';
  v_seed_date date := '2026-04-24';
  v_affected_topics uuid[];
BEGIN
  -- Pre-check
  SELECT COUNT(*) INTO v_seed_count
  FROM public.posts
  WHERE author_id = v_author AND created_at::date = v_seed_date;

  IF v_seed_count <> 509 THEN
    RAISE EXCEPTION 'Aborting: expected 509 seed posts, found %', v_seed_count;
  END IF;

  -- Capture affected topics for later recount
  SELECT array_agg(DISTINCT topic_id) INTO v_affected_topics
  FROM public.posts
  WHERE author_id = v_author AND created_at::date = v_seed_date;

  -- Archive posts
  INSERT INTO public.posts_archive_fredbrewer_20260610
  SELECT * FROM public.posts
  WHERE author_id = v_author AND created_at::date = v_seed_date;
  GET DIAGNOSTICS v_archived_posts = ROW_COUNT;

  IF v_archived_posts <> 509 THEN
    RAISE EXCEPTION 'Aborting: archived % posts, expected 509', v_archived_posts;
  END IF;

  -- Archive ratings on those posts
  INSERT INTO public.ratings_archive_fredbrewer_20260610
  SELECT r.* FROM public.ratings r
  WHERE r.post_id IN (SELECT id FROM public.posts_archive_fredbrewer_20260610);
  GET DIAGNOSTICS v_archived_ratings = ROW_COUNT;

  -- Archive comments (should be 0 but defensive)
  INSERT INTO public.comments_archive_fredbrewer_20260610
  SELECT c.* FROM public.comments c
  WHERE c.post_id IN (SELECT id FROM public.posts_archive_fredbrewer_20260610);

  -- Disable triggers for the bulk delete (the per-row rating recompute would otherwise time out)
  SET LOCAL session_replication_role = replica;

  -- Delete dependents first, strictly scoped by archived post ids
  DELETE FROM public.ratings   WHERE post_id IN (SELECT id FROM public.posts_archive_fredbrewer_20260610);
  DELETE FROM public.favorites WHERE post_id IN (SELECT id FROM public.posts_archive_fredbrewer_20260610);
  DELETE FROM public.comments  WHERE post_id IN (SELECT id FROM public.posts_archive_fredbrewer_20260610);
  DELETE FROM public.reports   WHERE post_id IN (SELECT id FROM public.posts_archive_fredbrewer_20260610);

  -- Delete the seed posts themselves (double-filtered for safety)
  DELETE FROM public.posts
  WHERE author_id = v_author
    AND created_at::date = v_seed_date
    AND id IN (SELECT id FROM public.posts_archive_fredbrewer_20260610);

  -- Re-enable triggers
  SET LOCAL session_replication_role = DEFAULT;

  -- Post-check: fredbrewer should have exactly 131 posts remaining
  SELECT COUNT(*) INTO v_remaining_fred
  FROM public.posts WHERE author_id = v_author;

  IF v_remaining_fred <> 131 THEN
    RAISE EXCEPTION 'Aborting: fredbrewer has % remaining posts, expected 131', v_remaining_fred;
  END IF;

  -- Recompute topic post counts for affected topics only
  UPDATE public.topics t
  SET post_count = (SELECT COUNT(*) FROM public.posts p WHERE p.topic_id = t.id)
  WHERE t.id = ANY(v_affected_topics);

  RAISE NOTICE 'Done. Archived: % posts, % ratings. Remaining fredbrewer posts: %',
    v_archived_posts, v_archived_ratings, v_remaining_fred;
END $$;