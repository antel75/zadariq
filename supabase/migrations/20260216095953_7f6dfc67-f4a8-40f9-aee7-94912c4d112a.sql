
-- City Pulse community votes table
CREATE TABLE public.city_pulse_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_id TEXT NOT NULL,
  vote_level TEXT NOT NULL CHECK (vote_level IN ('quiet', 'moderate', 'lively')),
  fingerprint_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for rate limiting lookups
CREATE INDEX idx_city_pulse_votes_fingerprint_time ON public.city_pulse_votes (fingerprint_hash, created_at DESC);
-- Index for aggregation
CREATE INDEX idx_city_pulse_votes_zone_time ON public.city_pulse_votes (zone_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.city_pulse_votes ENABLE ROW LEVEL SECURITY;

-- Anyone can read aggregated votes (we'll aggregate in queries)
CREATE POLICY "Anyone can read city pulse votes"
  ON public.city_pulse_votes FOR SELECT
  USING (true);

-- Anyone can insert votes (anonymous, rate-limited in edge function)
CREATE POLICY "Anyone can submit city pulse votes"
  ON public.city_pulse_votes FOR INSERT
  WITH CHECK (true);

-- Auto-cleanup: delete votes older than 2 hours (run via pg_cron or manual)
-- For now, we'll filter by time in queries
