
ALTER TABLE public.posts
  ADD CONSTRAINT posts_author_id_profiles_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id);
