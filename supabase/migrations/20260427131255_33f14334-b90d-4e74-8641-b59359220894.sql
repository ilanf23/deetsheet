UPDATE public.posts
SET
  title   = regexp_replace(replace(title,   '—', ', '), '\s*,\s*,\s*', ', ', 'g'),
  content = regexp_replace(replace(content, '—', ', '), '\s*,\s*,\s*', ', ', 'g')
WHERE title LIKE '%—%' OR content LIKE '%—%';

UPDATE public.comments
SET content = regexp_replace(replace(content, '—', ', '), '\s*,\s*,\s*', ', ', 'g')
WHERE content LIKE '%—%';

UPDATE public.topics
SET
  name        = replace(name, '—', ', '),
  description = replace(description, '—', ', ')
WHERE name LIKE '%—%' OR COALESCE(description, '') LIKE '%—%';