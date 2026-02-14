
CREATE TABLE public.water_outages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  published_date DATE NOT NULL,
  outage_date DATE,
  area TEXT NOT NULL,
  time_from TEXT,
  time_until TEXT,
  raw_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_water_outages_outage_date ON public.water_outages (outage_date);
CREATE INDEX idx_water_outages_published_date ON public.water_outages (published_date);

ALTER TABLE public.water_outages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Water outages are publicly readable"
  ON public.water_outages FOR SELECT USING (true);

CREATE POLICY "Service role can manage water outages"
  ON public.water_outages FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE TRIGGER update_water_outages_updated_at
  BEFORE UPDATE ON public.water_outages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
