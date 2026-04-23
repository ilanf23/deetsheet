DELETE FROM public.posts WHERE topic_id IN (SELECT id FROM public.topics WHERE category_name = 'Companies');
DELETE FROM public.topic_follows WHERE topic_id IN (SELECT id FROM public.topics WHERE category_name = 'Companies');
DELETE FROM public.post_drafts WHERE topic_id IN (SELECT id FROM public.topics WHERE category_name = 'Companies');
DELETE FROM public.topics WHERE category_name = 'Companies';