
-- EV Chargers table
CREATE TABLE public.ev_chargers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  operator text,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  address text,
  plug_types text[] DEFAULT '{}',
  power_kw integer,
  plug_count integer DEFAULT 1,
  status text NOT NULL DEFAULT 'unknown',
  confidence integer NOT NULL DEFAULT 0,
  source text NOT NULL DEFAULT 'manual',
  verified boolean NOT NULL DEFAULT false,
  osm_id text,
  last_reported_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Unique constraint on osm_id to prevent duplicates
CREATE UNIQUE INDEX idx_ev_chargers_osm_id ON public.ev_chargers (osm_id) WHERE osm_id IS NOT NULL;

-- Enable RLS
ALTER TABLE public.ev_chargers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read ev chargers"
  ON public.ev_chargers FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage ev chargers"
  ON public.ev_chargers FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can manage ev chargers"
  ON public.ev_chargers FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Trigger for updated_at
CREATE TRIGGER update_ev_chargers_updated_at
  BEFORE UPDATE ON public.ev_chargers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- EV Charger Reports table
CREATE TABLE public.ev_charger_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  charger_id uuid NOT NULL REFERENCES public.ev_chargers(id) ON DELETE CASCADE,
  status text NOT NULL,
  user_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ev_charger_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read ev charger reports"
  ON public.ev_charger_reports FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert ev charger reports"
  ON public.ev_charger_reports FOR INSERT
  WITH CHECK (true);

-- Index for fast lookups
CREATE INDEX idx_ev_charger_reports_charger ON public.ev_charger_reports (charger_id, created_at DESC);
CREATE INDEX idx_ev_charger_reports_user_cooldown ON public.ev_charger_reports (charger_id, user_hash, created_at DESC);
