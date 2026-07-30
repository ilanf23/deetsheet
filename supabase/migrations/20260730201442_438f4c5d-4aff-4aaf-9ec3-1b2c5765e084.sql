
-- ============ site settings ============
CREATE TABLE public.site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read site settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage site settings" ON public.site_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
GRANT INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;

INSERT INTO public.site_settings (key, value)
VALUES ('user_messaging_enabled', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;

CREATE TRIGGER site_settings_updated_at BEFORE UPDATE ON public.site_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.user_messaging_enabled()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT value = 'true'::jsonb FROM public.site_settings WHERE key = 'user_messaging_enabled'), false)
$$;

-- ============ blocks ============
CREATE TABLE public.user_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL,
  blocked_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);
GRANT SELECT, INSERT, DELETE ON public.user_blocks TO authenticated;
GRANT ALL ON public.user_blocks TO service_role;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read blocks involving them" ON public.user_blocks FOR SELECT TO authenticated
  USING (blocker_id = auth.uid() OR blocked_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users create own blocks" ON public.user_blocks FOR INSERT TO authenticated
  WITH CHECK (blocker_id = auth.uid());
CREATE POLICY "Users delete own blocks" ON public.user_blocks FOR DELETE TO authenticated
  USING (blocker_id = auth.uid());

CREATE OR REPLACE FUNCTION public.is_blocked_pair(_a uuid, _b uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_blocks
    WHERE (blocker_id = _a AND blocked_id = _b) OR (blocker_id = _b AND blocked_id = _a)
  )
$$;

-- ============ thread request state ============
ALTER TABLE public.message_threads
  ADD COLUMN IF NOT EXISTS request_status text NOT NULL DEFAULT 'accepted',
  ADD COLUMN IF NOT EXISTS initiated_by uuid;

-- ============ thread reports ============
CREATE TABLE public.thread_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.message_threads(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL,
  reported_user_id uuid,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.thread_reports TO authenticated;
GRANT ALL ON public.thread_reports TO service_role;
ALTER TABLE public.thread_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users create own thread reports" ON public.thread_reports FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "Reporters and admins read thread reports" ON public.thread_reports FOR SELECT TO authenticated
  USING (reporter_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update thread reports" ON public.thread_reports FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER thread_reports_updated_at BEFORE UPDATE ON public.thread_reports
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ email preference ============
ALTER TABLE public.email_preferences
  ADD COLUMN IF NOT EXISTS member_messages boolean NOT NULL DEFAULT true;

-- ============ guards ============
CREATE OR REPLACE FUNCTION public.guard_direct_thread()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  starter uuid := auth.uid();
  recipient uuid;
  is_new_account boolean;
  started_today int;
  had_prior boolean;
BEGIN
  IF NEW.kind <> 'direct' THEN
    RETURN NEW;
  END IF;

  IF starter IS NULL THEN
    RAISE EXCEPTION 'Sign in to start a conversation';
  END IF;

  IF NOT public.user_messaging_enabled() THEN
    RAISE EXCEPTION 'Member-to-member messaging is currently disabled';
  END IF;

  recipient := CASE WHEN NEW.user_id = starter THEN NEW.other_user_id ELSE NEW.user_id END;

  IF public.is_blocked_pair(starter, recipient) THEN
    RAISE EXCEPTION 'You cannot message this member';
  END IF;

  SELECT (p.created_at > now() - interval '7 days')
         OR NOT EXISTS (SELECT 1 FROM public.posts po WHERE po.author_id = starter AND po.status = 'approved')
    INTO is_new_account
  FROM public.profiles p WHERE p.id = starter;

  IF COALESCE(is_new_account, true) THEN
    SELECT count(*) INTO started_today
    FROM public.message_threads t
    WHERE t.kind = 'direct' AND t.initiated_by = starter AND t.created_at > now() - interval '1 day';
    IF started_today >= 5 THEN
      RAISE EXCEPTION 'You can start up to 5 new conversations per day';
    END IF;
  END IF;

  NEW.initiated_by := starter;

  -- A conversation is a request unless the recipient has previously messaged
  -- the starter in an accepted direct thread.
  SELECT EXISTS (
    SELECT 1 FROM public.message_threads t
    WHERE t.kind = 'direct'
      AND t.request_status = 'accepted'
      AND ((t.user_id = starter AND t.other_user_id = recipient)
        OR (t.user_id = recipient AND t.other_user_id = starter))
  ) INTO had_prior;

  NEW.request_status := CASE WHEN had_prior THEN 'accepted' ELSE 'pending' END;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_guard_direct_thread BEFORE INSERT ON public.message_threads
FOR EACH ROW EXECUTE FUNCTION public.guard_direct_thread();

CREATE OR REPLACE FUNCTION public.guard_message_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  t public.message_threads%ROWTYPE;
  other uuid;
  sent_last_hour int;
BEGIN
  SELECT * INTO t FROM public.message_threads WHERE id = NEW.thread_id;
  IF t.id IS NULL THEN
    RAISE EXCEPTION 'Thread not found';
  END IF;

  IF NEW.sender_role = 'admin' THEN
    RETURN NEW;
  END IF;

  SELECT count(*) INTO sent_last_hour
  FROM public.messages m
  WHERE m.sender_id = NEW.sender_id AND m.created_at > now() - interval '1 hour';
  IF sent_last_hour >= 30 THEN
    RAISE EXCEPTION 'Too many messages sent — please try again later';
  END IF;

  IF t.kind <> 'direct' THEN
    RETURN NEW;
  END IF;

  IF NOT public.user_messaging_enabled() THEN
    RAISE EXCEPTION 'Member-to-member messaging is currently disabled';
  END IF;

  other := CASE WHEN t.user_id = NEW.sender_id THEN t.other_user_id ELSE t.user_id END;
  IF public.is_blocked_pair(NEW.sender_id, other) THEN
    RAISE EXCEPTION 'You cannot message this member';
  END IF;

  IF t.request_status = 'declined' THEN
    RAISE EXCEPTION 'This conversation is closed';
  END IF;

  -- While a request is pending only the initiator may write, and only a few times.
  IF t.request_status = 'pending' THEN
    IF NEW.sender_id <> t.initiated_by THEN
      RAISE EXCEPTION 'Accept this request before replying';
    END IF;
    IF (SELECT count(*) FROM public.messages m WHERE m.thread_id = t.id) >= 3 THEN
      RAISE EXCEPTION 'Wait for this member to accept your request';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_guard_message_insert BEFORE INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.guard_message_insert();

-- ============ block-aware thread visibility ============
DROP POLICY IF EXISTS "Users read own threads" ON public.message_threads;
CREATE POLICY "Users read own threads" ON public.message_threads FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin')
  OR (
    (user_id = auth.uid() OR (kind = 'direct' AND other_user_id = auth.uid()))
    AND (
      kind <> 'direct'
      OR other_user_id IS NULL
      OR NOT public.is_blocked_pair(user_id, other_user_id)
    )
  )
);
