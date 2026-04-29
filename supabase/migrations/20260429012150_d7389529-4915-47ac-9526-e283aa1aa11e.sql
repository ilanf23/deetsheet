
DROP INDEX IF EXISTS public.idx_comments_rewritten_partial;
ALTER TABLE public.comments DROP COLUMN IF EXISTS _rewritten;
DROP FUNCTION IF EXISTS public._gen_comment(text, boolean, float8, float8);
ALTER TABLE public.comments ENABLE TRIGGER comments_update_count;
