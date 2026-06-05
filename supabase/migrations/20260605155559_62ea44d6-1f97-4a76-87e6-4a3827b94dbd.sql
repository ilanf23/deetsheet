
SET session_replication_role = replica;

-- Comments authored by them (anywhere)
DELETE FROM comments
WHERE author_id IN (
  'b4c4496f-55a0-49b8-ae5b-337826cd19b9',
  'a61ea24c-0c6a-4eed-b498-82a69c963897'
);

-- Everything attached to their posts
WITH ilan_posts AS (
  SELECT id FROM posts
  WHERE author_id IN (
    'b4c4496f-55a0-49b8-ae5b-337826cd19b9',
    'a61ea24c-0c6a-4eed-b498-82a69c963897'
  )
)
DELETE FROM comments  WHERE post_id IN (SELECT id FROM ilan_posts);

WITH ilan_posts AS (
  SELECT id FROM posts
  WHERE author_id IN (
    'b4c4496f-55a0-49b8-ae5b-337826cd19b9',
    'a61ea24c-0c6a-4eed-b498-82a69c963897'
  )
)
DELETE FROM ratings   WHERE post_id IN (SELECT id FROM ilan_posts);

WITH ilan_posts AS (
  SELECT id FROM posts
  WHERE author_id IN (
    'b4c4496f-55a0-49b8-ae5b-337826cd19b9',
    'a61ea24c-0c6a-4eed-b498-82a69c963897'
  )
)
DELETE FROM favorites WHERE post_id IN (SELECT id FROM ilan_posts);

WITH ilan_posts AS (
  SELECT id FROM posts
  WHERE author_id IN (
    'b4c4496f-55a0-49b8-ae5b-337826cd19b9',
    'a61ea24c-0c6a-4eed-b498-82a69c963897'
  )
)
DELETE FROM reports   WHERE post_id IN (SELECT id FROM ilan_posts);

-- The posts themselves
DELETE FROM posts
WHERE author_id IN (
  'b4c4496f-55a0-49b8-ae5b-337826cd19b9',
  'a61ea24c-0c6a-4eed-b498-82a69c963897'
);

SET session_replication_role = DEFAULT;

-- Recompute denormalized counts that triggers normally maintain
UPDATE public.topics t
SET post_count = COALESCE(c.cnt, 0)
FROM (SELECT topic_id, COUNT(*) AS cnt FROM public.posts GROUP BY topic_id) c
WHERE t.id = c.topic_id AND t.post_count IS DISTINCT FROM c.cnt;

UPDATE public.topics SET post_count = 0
WHERE id NOT IN (SELECT topic_id FROM public.posts) AND post_count <> 0;

UPDATE public.posts p
SET comment_count = COALESCE(c.cnt, 0)
FROM (SELECT post_id, COUNT(*) AS cnt FROM public.comments GROUP BY post_id) c
WHERE p.id = c.post_id AND p.comment_count IS DISTINCT FROM c.cnt;

UPDATE public.posts SET comment_count = 0
WHERE id NOT IN (SELECT post_id FROM public.comments) AND comment_count <> 0;
