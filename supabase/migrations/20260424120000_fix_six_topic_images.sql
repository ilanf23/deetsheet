-- Fix image_url for topics whose seeded URLs in migration
-- 20260423150201 were wrong (Florida was a Statue of Liberty shot)
-- or duplicated the same generic pets photo (Dogs/Birds/Horses/Rabbits).
UPDATE public.topics t SET image_url = v.image_url
FROM (VALUES
  ('Cowboys', 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=300&q=80'),
  ('Dogs',    'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=300&q=80'),
  ('Birds',   'https://images.unsplash.com/photo-1444464666168-49d633b86797?w=300&q=80'),
  ('Golf',    'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=300&q=80'),
  ('Rabbits', 'https://images.unsplash.com/photo-1535241749838-299277b6305f?w=300&q=80'),
  ('Horses',  'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=300&q=80'),
  ('Florida', 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=300&q=80')
) AS v(name, image_url)
WHERE t.name = v.name;
