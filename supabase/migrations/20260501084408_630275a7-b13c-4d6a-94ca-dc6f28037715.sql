CREATE TABLE public.health_places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subcategory text NOT NULL CHECK (subcategory IN ('opca', 'dentalna', 'specijalisticka', 'bolnica', 'ljekarna')),
  specialty text,
  address text,
  neighborhood text,
  phone text,
  website text,
  description text,
  head_doctor text,
  hours jsonb DEFAULT '{}'::jsonb,
  lat double precision,
  lng double precision,
  display_order integer NOT NULL DEFAULT 100,
  enabled boolean NOT NULL DEFAULT true,
  verified boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid
);

ALTER TABLE public.health_places ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read enabled health places"
  ON public.health_places FOR SELECT
  USING (enabled = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage health places"
  ON public.health_places FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_health_places_updated_at
  BEFORE UPDATE ON public.health_places
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_health_places_subcategory ON public.health_places(subcategory);
CREATE INDEX idx_health_places_enabled ON public.health_places(enabled);