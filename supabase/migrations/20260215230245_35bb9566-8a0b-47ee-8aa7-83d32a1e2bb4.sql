
-- =============================================
-- 1) open_now_places — nocturnal/24h locations
-- =============================================
CREATE TABLE public.open_now_places (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL, -- food_night, bakery, gas, atm, etc.
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  maps_url TEXT,
  open_247 BOOLEAN NOT NULL DEFAULT false,
  open_from TIME,
  open_until TIME,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.open_now_places ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read enabled open_now_places"
  ON public.open_now_places FOR SELECT
  USING (enabled = true);

CREATE POLICY "Admins can manage open_now_places"
  ON public.open_now_places FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- 2) city_contacts — taxi, emergency, police...
-- =============================================
CREATE TABLE public.city_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL, -- taxi, emergency, police, hospital, etc.
  name TEXT NOT NULL,
  phone TEXT,
  website TEXT,
  maps_url TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.city_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read enabled city_contacts"
  ON public.city_contacts FOR SELECT
  USING (enabled = true);

CREATE POLICY "Admins can manage city_contacts"
  ON public.city_contacts FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
