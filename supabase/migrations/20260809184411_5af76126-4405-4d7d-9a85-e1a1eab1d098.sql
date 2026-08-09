ALTER TABLE public.message_threads
  ADD COLUMN IF NOT EXISTS hidden_for_user_at timestamptz,
  ADD COLUMN IF NOT EXISTS hidden_for_other_at timestamptz;

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
    -- A new message un-hides the thread for whoever isn't the sender.
    hidden_for_user_at = CASE WHEN user_id IS DISTINCT FROM NEW.sender_id THEN NULL ELSE hidden_for_user_at END,
    hidden_for_other_at = CASE WHEN other_user_id IS DISTINCT FROM NEW.sender_id THEN NULL ELSE hidden_for_other_at END,
    updated_at = now()
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_author_of_post_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  msg text;
BEGIN
  IF NEW.author_id IS NULL OR OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  msg := CASE NEW.status
    WHEN 'approved' THEN 'Your post "' || NEW.title || '" was approved'
    WHEN 'pending' THEN 'Your post "' || NEW.title || '" is pending review'
    WHEN 'rejected' THEN 'Your post "' || NEW.title || '" was not approved'
    ELSE 'Your post "' || NEW.title || '" status changed to ' || NEW.status
  END;

  INSERT INTO public.notifications (user_id, type, message, link, post_id)
  VALUES (NEW.author_id, 'post_status', msg,
          CASE
            WHEN NEW.status = 'approved' THEN public.build_post_link(NEW.id)
            WHEN NEW.status IN ('pending', 'rejected') THEN '/profile?edit=' || NEW.id::text
            ELSE '/profile'
          END,
          NEW.id);
  RETURN NEW;
END;
$function$;