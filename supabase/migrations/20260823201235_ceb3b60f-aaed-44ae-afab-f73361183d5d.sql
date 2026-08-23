ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS deleted_by uuid;

CREATE INDEX IF NOT EXISTS messages_thread_created_idx ON public.messages (thread_id, created_at);

-- Column-scoped UPDATE grant: even with the policy below, an authenticated
-- caller can only ever write the two soft-delete columns.
GRANT UPDATE (deleted_at, deleted_by) ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;

DROP POLICY IF EXISTS "Senders and admins soft-delete messages" ON public.messages;
CREATE POLICY "Senders and admins soft-delete messages"
ON public.messages
FOR UPDATE
TO authenticated
USING (sender_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (sender_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Belt and braces: reject any UPDATE that touches content/identity columns.
CREATE OR REPLACE FUNCTION public.guard_message_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.thread_id IS DISTINCT FROM OLD.thread_id
     OR NEW.sender_id IS DISTINCT FROM OLD.sender_id
     OR NEW.sender_role IS DISTINCT FROM OLD.sender_role
     OR NEW.body_html IS DISTINCT FROM OLD.body_html
     OR NEW.body_text IS DISTINCT FROM OLD.body_text
     OR NEW.slip IS DISTINCT FROM OLD.slip
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Messages are immutable; only deletion is allowed.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_message_update ON public.messages;
CREATE TRIGGER guard_message_update
BEFORE UPDATE ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.guard_message_update();