-- Drop unused tables and their dependent triggers/functions
DROP TRIGGER IF EXISTS votes_score_update ON public.votes;
DROP FUNCTION IF EXISTS public.update_post_score() CASCADE;
DROP TABLE IF EXISTS public.votes CASCADE;

DROP TRIGGER IF EXISTS comment_likes_count_update ON public.comment_likes;
DROP FUNCTION IF EXISTS public.update_comment_like_count() CASCADE;
DROP TABLE IF EXISTS public.comment_likes CASCADE;

DROP TABLE IF EXISTS public.post_drafts CASCADE;
DROP TABLE IF EXISTS public.email_captures CASCADE;