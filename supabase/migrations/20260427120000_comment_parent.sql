-- Threaded comments: link replies to their parent comment.
-- NULL parent_comment_id = top-level (comment on the post itself).

ALTER TABLE public.comments
  ADD COLUMN parent_comment_id UUID NULL
    REFERENCES public.comments(id) ON DELETE CASCADE;

CREATE INDEX comments_parent_comment_id_idx
  ON public.comments(parent_comment_id);
