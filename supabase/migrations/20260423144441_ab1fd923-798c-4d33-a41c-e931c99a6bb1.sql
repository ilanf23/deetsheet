-- 1. Locations table -----------------------------------------------------
CREATE TABLE public.locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city text NOT NULL,
  state text NOT NULL,
  country text NOT NULL DEFAULT 'US',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT locations_city_state_country_unique UNIQUE (city, state, country),
  CONSTRAINT locations_state_length CHECK (char_length(state) = 2),
  CONSTRAINT locations_country_length CHECK (char_length(country) = 2),
  CONSTRAINT locations_city_not_blank CHECK (char_length(btrim(city)) > 0)
);

CREATE INDEX idx_locations_city_state ON public.locations (lower(city), state, country);
CREATE INDEX idx_locations_state ON public.locations (state, country);

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Public read: needed so the city catalog can be cached client-side.
CREATE POLICY "Locations are viewable by everyone"
  ON public.locations
  FOR SELECT
  USING (true);

-- Only admins can mutate the catalog directly. End-user "add my city" flow
-- will go through a SECURITY DEFINER function below.
CREATE POLICY "Admins can insert locations"
  ON public.locations
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update locations"
  ON public.locations
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete locations"
  ON public.locations
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 2. Profiles: add optional location ------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL;

CREATE INDEX idx_profiles_location_id ON public.profiles (location_id);

-- 3. Posts: add optional location + national flag -----------------------
ALTER TABLE public.posts
  ADD COLUMN location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  ADD COLUMN is_national boolean NOT NULL DEFAULT false;

CREATE INDEX idx_posts_location_id ON public.posts (location_id);
CREATE INDEX idx_posts_is_national ON public.posts (is_national) WHERE is_national = true;

-- 4. Helper to get-or-create a location atomically ----------------------
-- Lets authenticated users save a city without granting them write access
-- to the catalog, and dedupes via the unique constraint.
CREATE OR REPLACE FUNCTION public.get_or_create_location(
  _city text,
  _state text,
  _country text DEFAULT 'US'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _normalized_city text;
  _normalized_state text;
  _normalized_country text;
  _existing_id uuid;
  _new_id uuid;
BEGIN
  IF _city IS NULL OR char_length(btrim(_city)) = 0 THEN
    RAISE EXCEPTION 'city is required';
  END IF;
  IF _state IS NULL OR char_length(_state) <> 2 THEN
    RAISE EXCEPTION 'state must be a 2-letter code';
  END IF;

  _normalized_city := btrim(_city);
  _normalized_state := upper(btrim(_state));
  _normalized_country := upper(coalesce(btrim(_country), 'US'));

  IF char_length(_normalized_country) <> 2 THEN
    RAISE EXCEPTION 'country must be a 2-letter code';
  END IF;

  SELECT id INTO _existing_id
  FROM public.locations
  WHERE lower(city) = lower(_normalized_city)
    AND state = _normalized_state
    AND country = _normalized_country
  LIMIT 1;

  IF _existing_id IS NOT NULL THEN
    RETURN _existing_id;
  END IF;

  INSERT INTO public.locations (city, state, country)
  VALUES (_normalized_city, _normalized_state, _normalized_country)
  ON CONFLICT (city, state, country) DO UPDATE SET city = EXCLUDED.city
  RETURNING id INTO _new_id;

  RETURN _new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_or_create_location(text, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.get_or_create_location(text, text, text) TO authenticated;