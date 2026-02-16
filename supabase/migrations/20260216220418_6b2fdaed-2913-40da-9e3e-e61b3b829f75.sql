
-- Sports events cache table
CREATE TABLE public.sports_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sport TEXT NOT NULL DEFAULT 'football', -- football, basketball, handball
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  home_score INTEGER,
  away_score INTEGER,
  match_status TEXT NOT NULL DEFAULT 'upcoming', -- upcoming, live, finished, postponed
  match_minute TEXT, -- e.g. '63' for live matches
  start_time TIMESTAMPTZ NOT NULL,
  league TEXT,
  venue TEXT,
  source_url TEXT,
  api_match_id TEXT UNIQUE, -- external ID for dedup
  is_local_team BOOLEAN NOT NULL DEFAULT false, -- true for NK Zadar, KK Zadar
  team_tag TEXT, -- nk_zadar, kk_zadar, hajduk, croatia_football, croatia_basketball, croatia_handball
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS (public read, no public write)
ALTER TABLE public.sports_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sports events are publicly readable"
ON public.sports_events FOR SELECT
USING (true);

-- Index for quick lookups
CREATE INDEX idx_sports_events_status ON public.sports_events(match_status);
CREATE INDEX idx_sports_events_start_time ON public.sports_events(start_time);

-- Updated_at trigger
CREATE TRIGGER update_sports_events_updated_at
BEFORE UPDATE ON public.sports_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
