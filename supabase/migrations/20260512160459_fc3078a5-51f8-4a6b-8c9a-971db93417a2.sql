-- Account security checklist table
CREATE TABLE public.account_security (
  user_id UUID NOT NULL PRIMARY KEY,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  strong_password_set BOOLEAN NOT NULL DEFAULT false,
  two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
  recovery_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.account_security ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own security record"
  ON public.account_security FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all security records"
  ON public.account_security FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert their own security record"
  ON public.account_security FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own security record"
  ON public.account_security FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Updated-at trigger
CREATE OR REPLACE FUNCTION public.touch_account_security_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER account_security_set_updated_at
BEFORE UPDATE ON public.account_security
FOR EACH ROW
EXECUTE FUNCTION public.touch_account_security_updated_at();

-- Auto-create a row on signup, mirroring email confirmation state from auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user_security()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.account_security (user_id, email_verified)
  VALUES (NEW.id, NEW.email_confirmed_at IS NOT NULL)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_security ON auth.users;
CREATE TRIGGER on_auth_user_created_security
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_security();

-- Keep email_verified in sync when the user confirms their email later
CREATE OR REPLACE FUNCTION public.sync_email_verified()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (OLD.email_confirmed_at IS DISTINCT FROM NEW.email_confirmed_at) THEN
    UPDATE public.account_security
    SET email_verified = (NEW.email_confirmed_at IS NOT NULL)
    WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_email_confirmed
AFTER UPDATE ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.sync_email_verified();

-- Backfill existing users
INSERT INTO public.account_security (user_id, email_verified)
SELECT id, email_confirmed_at IS NOT NULL FROM auth.users
ON CONFLICT (user_id) DO NOTHING;