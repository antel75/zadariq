
-- Table for storing daily power outage data from HEP
CREATE TABLE public.power_outages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  outage_date DATE NOT NULL,
  area TEXT NOT NULL,
  time_from TEXT,
  time_until TEXT,
  reason TEXT,
  raw_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for quick date lookups
CREATE INDEX idx_power_outages_date ON public.power_outages (outage_date);

-- Enable RLS
ALTER TABLE public.power_outages ENABLE ROW LEVEL SECURITY;

-- Public read access (everyone should see outage info)
CREATE POLICY "Power outages are publicly readable"
  ON public.power_outages
  FOR SELECT
  USING (true);

-- Only service role can insert/update/delete (via edge function)
CREATE POLICY "Service role can manage power outages"
  ON public.power_outages
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Trigger for updated_at
CREATE TRIGGER update_power_outages_updated_at
  BEFORE UPDATE ON public.power_outages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
