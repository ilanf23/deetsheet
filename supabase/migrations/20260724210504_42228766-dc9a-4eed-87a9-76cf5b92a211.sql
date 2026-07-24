
-- 1) Schema extensions
ALTER TABLE public.message_threads
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'admin',
  ADD COLUMN IF NOT EXISTS other_user_id uuid;

ALTER TABLE public.message_threads
  DROP CONSTRAINT IF EXISTS message_threads_kind_check;
ALTER TABLE public.message_threads
  ADD CONSTRAINT message_threads_kind_check CHECK (kind IN ('admin','direct'));

-- Ensure direct threads always have both participants and are not self-DMs
ALTER TABLE public.message_threads
  DROP CONSTRAINT IF EXISTS message_threads_direct_participants_check;
ALTER TABLE public.message_threads
  ADD CONSTRAINT message_threads_direct_participants_check CHECK (
    (kind = 'admin' AND other_user_id IS NULL)
    OR (kind = 'direct' AND other_user_id IS NOT NULL AND other_user_id <> user_id)
  );

-- One direct thread per unordered pair of users
CREATE UNIQUE INDEX IF NOT EXISTS message_threads_direct_pair_uidx
  ON public.message_threads (
    LEAST(user_id, other_user_id),
    GREATEST(user_id, other_user_id)
  )
  WHERE kind = 'direct';

-- 2) RLS policies — drop and recreate to include direct-thread participants

-- message_threads SELECT
DROP POLICY IF EXISTS "Users read own threads" ON public.message_threads;
CREATE POLICY "Users read own threads"
  ON public.message_threads FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR user_id = auth.uid()
    OR (kind = 'direct' AND other_user_id = auth.uid())
  );

-- message_threads INSERT
DROP POLICY IF EXISTS "Admins insert threads" ON public.message_threads;
DROP POLICY IF EXISTS "Insert admin or direct threads" ON public.message_threads;
CREATE POLICY "Insert admin or direct threads"
  ON public.message_threads FOR INSERT
  WITH CHECK (
    (kind = 'admin' AND public.has_role(auth.uid(), 'admin'::app_role))
    OR (
      kind = 'direct'
      AND other_user_id IS NOT NULL
      AND other_user_id <> user_id
      AND auth.uid() IN (user_id, other_user_id)
    )
  );

-- message_threads UPDATE (read state)
DROP POLICY IF EXISTS "Users update own thread read state" ON public.message_threads;
CREATE POLICY "Users update own thread read state"
  ON public.message_threads FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR user_id = auth.uid()
    OR (kind = 'direct' AND other_user_id = auth.uid())
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR user_id = auth.uid()
    OR (kind = 'direct' AND other_user_id = auth.uid())
  );

-- messages SELECT
DROP POLICY IF EXISTS "Read messages in own threads" ON public.messages;
CREATE POLICY "Read messages in own threads"
  ON public.messages FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.message_threads t
      WHERE t.id = messages.thread_id
        AND (
          t.user_id = auth.uid()
          OR (t.kind = 'direct' AND t.other_user_id = auth.uid())
        )
    )
  );

-- messages INSERT
DROP POLICY IF EXISTS "Users reply on own threads; admins send any" ON public.messages;
CREATE POLICY "Users reply on own threads; admins send any"
  ON public.messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND (
      (sender_role = 'admin' AND public.has_role(auth.uid(), 'admin'::app_role))
      OR (
        sender_role = 'user'
        AND EXISTS (
          SELECT 1 FROM public.message_threads t
          WHERE t.id = messages.thread_id
            AND (
              t.user_id = auth.uid()
              OR (t.kind = 'direct' AND t.other_user_id = auth.uid())
            )
        )
      )
    )
  );

-- 3) Trigger: don't flip direct threads into admin's needs_contact state
CREATE OR REPLACE FUNCTION public.on_new_message_touch_thread()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.message_threads
  SET
    last_message_at = NEW.created_at,
    last_sender = NEW.sender_role,
    status = CASE
      WHEN kind = 'direct' THEN status
      WHEN NEW.sender_role = 'user' THEN 'needs_contact'
      ELSE status
    END,
    updated_at = now()
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$function$;
