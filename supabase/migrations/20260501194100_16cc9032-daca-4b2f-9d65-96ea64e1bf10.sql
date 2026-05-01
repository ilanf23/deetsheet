CREATE OR REPLACE FUNCTION public.auto_promote_topic_image()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  winner_url TEXT;
BEGIN
  SELECT url INTO winner_url
  FROM public.topic_images
  WHERE topic_id = NEW.topic_id
    AND rating_count >= 1
  ORDER BY average_rating DESC, rating_count DESC, created_at ASC
  LIMIT 1;

  IF winner_url IS NOT NULL THEN
    UPDATE public.topics
    SET image_url = winner_url
    WHERE id = NEW.topic_id
      AND (image_url IS DISTINCT FROM winner_url);
  END IF;

  RETURN NEW;
END;
$function$;