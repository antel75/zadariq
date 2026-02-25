
-- Create city_events table for scraped events
CREATE TABLE public.city_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  event_date date,
  event_time text,
  location text,
  source text NOT NULL,
  source_url text,
  image_url text,
  hash text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT city_events_hash_key UNIQUE (hash)
);

-- Enable RLS
ALTER TABLE public.city_events ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Public can read city events"
  ON public.city_events FOR SELECT
  USING (true);

-- Service role can manage
CREATE POLICY "Service role can manage city events"
  ON public.city_events FOR ALL
  USING (auth.role() = 'service_role'::text)
  WITH CHECK (auth.role() = 'service_role'::text);

-- Admins can manage
CREATE POLICY "Admins can manage city events"
  ON public.city_events FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Auto-update timestamp
CREATE TRIGGER update_city_events_updated_at
  BEFORE UPDATE ON public.city_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
