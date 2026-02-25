
-- Remove old cron job if exists
SELECT cron.unschedule('scrape-events-daily') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'scrape-events-daily');

-- Drop old table and recreate with new schema
DROP TABLE IF EXISTS public.city_events;

CREATE TABLE public.city_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  venue TEXT,
  event_date_from DATE,
  event_date_to DATE,
  image_url TEXT,
  website_url TEXT,
  source TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'kultura',
  region TEXT NOT NULL DEFAULT 'zadar',
  hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT city_events_hash_unique UNIQUE (hash),
  CONSTRAINT city_events_category_check CHECK (category IN ('kultura', 'nocni-zivot', 'festival', 'sport')),
  CONSTRAINT city_events_region_check CHECK (region IN ('zadar', 'zrce', 'tisno'))
);

-- RLS
ALTER TABLE public.city_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read city events"
  ON public.city_events FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage city events"
  ON public.city_events FOR ALL
  USING (auth.role() = 'service_role'::text)
  WITH CHECK (auth.role() = 'service_role'::text);

CREATE POLICY "Admins can manage city events"
  ON public.city_events FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_city_events_updated_at
  BEFORE UPDATE ON public.city_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for date queries
CREATE INDEX idx_city_events_date_from ON public.city_events (event_date_from);
CREATE INDEX idx_city_events_region ON public.city_events (region);
CREATE INDEX idx_city_events_category ON public.city_events (category);
