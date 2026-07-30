CREATE OR REPLACE FUNCTION public.notify_user_of_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  t public.message_threads%ROWTYPE;
  recipient uuid;
  sender_label text;
BEGIN
  SELECT * INTO t FROM public.message_threads WHERE id = NEW.thread_id;
  IF t.id IS NULL THEN
    RETURN NEW;
  END IF;

  IF t.kind <> 'direct' THEN
    IF NEW.sender_role = 'user' THEN
      RETURN NEW;
    END IF;
    recipient := t.user_id;
    IF recipient IS NULL OR recipient = NEW.sender_id THEN
      RETURN NEW;
    END IF;
    INSERT INTO public.notifications (user_id, type, message, link, thread_id)
    VALUES (recipient, 'message', 'You received a message from DeetSheet',
            '/inbox/' || NEW.thread_id::text, NEW.thread_id);
    RETURN NEW;
  END IF;

  recipient := CASE WHEN t.user_id = NEW.sender_id THEN t.other_user_id ELSE t.user_id END;
  IF recipient IS NULL OR recipient = NEW.sender_id THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(NULLIF(btrim(p.name), ''), NULLIF(btrim(p.username), ''), 'A member')
    INTO sender_label FROM public.profiles p WHERE p.id = NEW.sender_id;

  INSERT INTO public.notifications (user_id, type, message, link, thread_id)
  VALUES (
    recipient,
    'message',
    CASE WHEN t.request_status = 'pending'
         THEN COALESCE(sender_label, 'A member') || ' sent you a message request'
         ELSE COALESCE(sender_label, 'A member') || ' sent you a message' END,
    '/inbox/' || NEW.thread_id::text,
    NEW.thread_id
  );
  RETURN NEW;
END;
$function$;