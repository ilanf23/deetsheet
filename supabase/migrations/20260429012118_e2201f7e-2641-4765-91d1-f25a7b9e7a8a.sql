
WITH batch AS (
  SELECT c.id, t.name AS topic_name, (c.parent_comment_id IS NULL) AS is_top_level
  FROM public.comments c
  JOIN public.posts  p ON p.id = c.post_id
  JOIN public.topics t ON t.id = p.topic_id
  WHERE c._rewritten = false
)
UPDATE public.comments c
SET content = public._gen_comment(b.topic_name, b.is_top_level, random(), random()),
    _rewritten = true
FROM batch b
WHERE c.id = b.id;
