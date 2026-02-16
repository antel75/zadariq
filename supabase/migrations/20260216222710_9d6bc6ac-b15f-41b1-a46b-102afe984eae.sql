
-- Team ID cache to avoid hardcoding API IDs
CREATE TABLE public.sports_teams_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  api_team_id INTEGER NOT NULL,
  sport TEXT NOT NULL DEFAULT 'football',
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sports_teams_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sports team cache is publicly readable"
ON public.sports_teams_cache FOR SELECT
USING (true);

-- Enable pg_cron and pg_net for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
