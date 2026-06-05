
-- Disable triggers for bulk delete (avoid 37k per-row rating-stat recalcs)
SET session_replication_role = replica;

DELETE FROM ratings              WHERE user_id::text   LIKE 'b1000000-%';
DELETE FROM favorites            WHERE user_id::text   LIKE 'b1000000-%';
DELETE FROM topic_image_ratings  WHERE user_id::text   LIKE 'b1000000-%';
DELETE FROM topic_follows        WHERE user_id::text   LIKE 'b1000000-%';
DELETE FROM user_follows         WHERE follower_id::text LIKE 'b1000000-%'
                                    OR following_id::text LIKE 'b1000000-%';
DELETE FROM user_roles           WHERE user_id::text   LIKE 'b1000000-%';
DELETE FROM account_security     WHERE user_id::text   LIKE 'b1000000-%';
DELETE FROM profiles             WHERE id::text        LIKE 'b1000000-%';

SET session_replication_role = DEFAULT;

-- Recompute rating aggregates for every post in one pass
UPDATE public.posts p
SET
  average_rating = COALESCE(r.avg_val, 0),
  rating_count   = COALESCE(r.cnt, 0)
FROM (
  SELECT post_id, ROUND(AVG(value)::numeric, 1) AS avg_val, COUNT(*) AS cnt
  FROM public.ratings
  GROUP BY post_id
) r
WHERE p.id = r.post_id
  AND (p.average_rating IS DISTINCT FROM COALESCE(r.avg_val, 0)
    OR p.rating_count   IS DISTINCT FROM COALESCE(r.cnt, 0));

-- Posts with no ratings left at all
UPDATE public.posts SET average_rating = 0, rating_count = 0
WHERE id NOT IN (SELECT post_id FROM public.ratings)
  AND (average_rating <> 0 OR rating_count <> 0);
