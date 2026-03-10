-- Add admin flag + email to profiles
ALTER TABLE public.profiles ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN email TEXT;

-- Reusable admin check (SECURITY DEFINER so it can read profiles during RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public AS $$
  SELECT COALESCE((SELECT is_admin FROM public.profiles WHERE id = auth.uid()), false);
$$;

-- Admin RLS policies for ALL tables (additive to existing user policies)
-- profiles
CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete any profile" ON public.profiles FOR DELETE USING (public.is_admin());

-- posts
CREATE POLICY "Admins can update any post" ON public.posts FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete any post" ON public.posts FOR DELETE USING (public.is_admin());

-- comments
CREATE POLICY "Admins can update any comment" ON public.comments FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete any comment" ON public.comments FOR DELETE USING (public.is_admin());

-- votes
CREATE POLICY "Admins can delete any vote" ON public.votes FOR DELETE USING (public.is_admin());

-- topics (currently has no INSERT/UPDATE/DELETE policies at all)
CREATE POLICY "Admins can insert topics" ON public.topics FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update topics" ON public.topics FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete topics" ON public.topics FOR DELETE USING (public.is_admin());

-- Update trigger to capture email on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'username', NEW.email);
  RETURN NEW;
END;
$$;

-- Backfill email for existing users
UPDATE public.profiles p SET email = u.email FROM auth.users u WHERE p.id = u.id AND p.email IS NULL;
