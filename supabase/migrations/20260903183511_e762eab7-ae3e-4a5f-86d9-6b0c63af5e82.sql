INSERT INTO public.review_reasons (kind, label, detail, sort_order)
SELECT v.kind, v.label, v.detail, v.sort_order
FROM (VALUES
  ('reject', 'Unproven information', 'Unproven information.', 52),
  ('reject', 'Too similar to another post', 'Too similar to another post.', 54)
) AS v(kind, label, detail, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.review_reasons r WHERE r.kind = v.kind AND r.label = v.label
);

UPDATE public.review_reasons
SET detail = replace(detail, ' — ', ', ')
WHERE detail LIKE '%—%';

UPDATE public.review_reasons
SET label = replace(label, ' — ', ', ')
WHERE label LIKE '%—%';

UPDATE public.site_pages
SET content = replace(replace(content, ' — ', ', '), '—', ', '),
    title = replace(replace(title, ' — ', ': '), '—', '-')
WHERE content LIKE '%—%' OR title LIKE '%—%';

UPDATE public.message_templates
SET subject = replace(subject, ' — ', ', '),
    title = replace(title, ' — ', ', '),
    body_html = replace(body_html, ' — ', ', ')
WHERE coalesce(subject,'') LIKE '%—%'
   OR coalesce(title,'') LIKE '%—%'
   OR coalesce(body_html,'') LIKE '%—%';