CREATE TABLE public.email_preferences (
  user_id uuid PRIMARY KEY,
  email text NOT NULL,
  post_updates boolean NOT NULL DEFAULT true,
  admin_messages boolean NOT NULL DEFAULT true,
  comment_notifications boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX email_preferences_email_key ON public.email_preferences (lower(email));

GRANT SELECT, INSERT, UPDATE ON public.email_preferences TO authenticated;
GRANT ALL ON public.email_preferences TO service_role;

ALTER TABLE public.email_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own email preferences"
ON public.email_preferences FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own email preferences"
ON public.email_preferences FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email preferences"
ON public.email_preferences FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_email_preferences_updated_at
BEFORE UPDATE ON public.email_preferences
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();