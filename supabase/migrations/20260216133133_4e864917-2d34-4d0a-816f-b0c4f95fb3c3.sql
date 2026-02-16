
-- City alerts table for live info feed
CREATE TABLE public.city_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  summary text NOT NULL,
  source text NOT NULL DEFAULT 'manual',
  source_url text,
  priority integer NOT NULL DEFAULT 50,
  valid_until timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  type text NOT NULL DEFAULT 'general',
  geo_relevance text,
  hash text NOT NULL,
  CONSTRAINT city_alerts_hash_unique UNIQUE(hash)
);

-- Enable RLS
ALTER TABLE public.city_alerts ENABLE ROW LEVEL SECURITY;

-- Public can read active alerts
CREATE POLICY "Public can read active city alerts"
ON public.city_alerts FOR SELECT
USING (valid_until > now());

-- Admins can manage all alerts
CREATE POLICY "Admins can manage city alerts"
ON public.city_alerts FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Service role can manage (for edge functions / scrapers)
CREATE POLICY "Service role can manage city alerts"
ON public.city_alerts FOR ALL
USING (auth.role() = 'service_role'::text)
WITH CHECK (auth.role() = 'service_role'::text);

-- Trigger for updated_at
CREATE TRIGGER update_city_alerts_updated_at
BEFORE UPDATE ON public.city_alerts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for priority sorting and expiry cleanup
CREATE INDEX idx_city_alerts_valid_priority ON public.city_alerts(valid_until DESC, priority DESC);
CREATE INDEX idx_city_alerts_hash ON public.city_alerts(hash);
