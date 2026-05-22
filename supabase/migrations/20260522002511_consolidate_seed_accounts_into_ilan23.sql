-- Consolidate 30 seed users + 1 abandoned empty profile into the Ilan23 account.
-- Transfers posts/comments authorship, then deletes the source users (cascades
-- profiles + per-user engagement rows: votes/likes/follows/favorites/ratings/etc.).
-- Per-user engagement is intentionally dropped: UNIQUE(post_id,user_id)
-- constraints would collide on transfer, and the engagement is fake.
--
-- Optional follow-up (NOT done here): posts.score is a stored column inflated by
-- the now-deleted fake votes. Recompute it once the scoring formula is confirmed.

DO $$
DECLARE
  v_target         uuid := 'b4c4496f-55a0-49b8-ae5b-337826cd19b9'; -- Ilan23
  v_source_ids     uuid[];
  v_posts_moved    integer;
  v_comments_moved integer;
  v_remaining      integer;
BEGIN
  -- Build the source id list: 30 seed users + 1 abandoned profile.
  SELECT array_agg(('b1000000-0000-0000-0000-' || lpad(g::text, 12, '0'))::uuid)
    INTO v_source_ids
  FROM generate_series(1, 30) AS g;
  v_source_ids := v_source_ids || ARRAY['4fb50ac5-cce1-4c4a-af43-dadaa5f19573'::uuid];

  -- Guard 1: target must exist.
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_target) THEN
    RAISE EXCEPTION 'Target Ilan23 user % does not exist; aborting.', v_target;
  END IF;

  -- Guard 2: target must not be in the removal set.
  IF v_target = ANY(v_source_ids) THEN
    RAISE EXCEPTION 'Target % is in the removal set; aborting.', v_target;
  END IF;

  -- Guard 3: do not touch fredbrewer.
  IF '6d711ce0-f0fd-4a42-b052-a2b72f43aea1'::uuid = ANY(v_source_ids) THEN
    RAISE EXCEPTION 'Refusing to remove fredbrewer; aborting.';
  END IF;

  -- 1. Transfer posts.
  UPDATE public.posts
     SET author_id = v_target
   WHERE author_id = ANY(v_source_ids);
  GET DIAGNOSTICS v_posts_moved = ROW_COUNT;

  -- 2. Transfer comments.
  UPDATE public.comments
     SET author_id = v_target
   WHERE author_id = ANY(v_source_ids);
  GET DIAGNOSTICS v_comments_moved = ROW_COUNT;

  -- 3. Delete source users; cascades profiles + per-user engagement rows.
  DELETE FROM auth.users WHERE id = ANY(v_source_ids);

  -- 4. Verify nothing in posts/comments still references the removed ids.
  SELECT COUNT(*) INTO v_remaining
    FROM (
      SELECT 1 FROM public.posts    WHERE author_id = ANY(v_source_ids)
      UNION ALL
      SELECT 1 FROM public.comments WHERE author_id = ANY(v_source_ids)
    ) s;

  IF v_remaining > 0 THEN
    RAISE EXCEPTION 'Verification failed: % rows still reference removed users. Rolling back.', v_remaining;
  END IF;

  RAISE NOTICE 'Consolidation complete: % posts moved, % comments moved, % source users removed.',
    v_posts_moved, v_comments_moved, array_length(v_source_ids, 1);
END $$;
