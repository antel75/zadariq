
-- Sports fetch status cache (singleton row per function)
CREATE TABLE public.sports_fetch_status (
  id text PRIMARY KEY DEFAULT 'fetch-sports',
  last_run_at timestamptz NOT NULL DEFAULT now(),
  ok boolean NOT NULL DEFAULT true,
  message text,
  fetched_count integer NOT NULL DEFAULT 0,
  consecutive_failures integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sports_fetch_status ENABLE ROW LEVEL SECURITY;

-- Public can read status (frontend needs it)
CREATE POLICY "Public can read sports fetch status"
  ON public.sports_fetch_status FOR SELECT
  USING (true);

-- Service role can manage status
CREATE POLICY "Service role can manage sports fetch status"
  ON public.sports_fetch_status FOR ALL
  USING (auth.role() = 'service_role'::text)
  WITH CHECK (auth.role() = 'service_role'::text);

-- Insert initial row
INSERT INTO public.sports_fetch_status (id, ok, message, fetched_count)
VALUES ('fetch-sports', true, 'Not yet run', 0);

-- Add source column to sports_events for manual vs API events
ALTER TABLE public.sports_events
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'api';

-- Add manual_expires_at for manually seeded events
ALTER TABLE public.sports_events
  ADD COLUMN IF NOT EXISTS manual_expires_at timestamptz;
