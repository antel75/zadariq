
-- Add freshness/anti-embarrassment columns to sports_events
ALTER TABLE public.sports_events
  ADD COLUMN IF NOT EXISTS fetched_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS confidence integer DEFAULT 50,
  ADD COLUMN IF NOT EXISTS is_stale boolean DEFAULT false;

-- Index for filtering non-stale events
CREATE INDEX IF NOT EXISTS idx_sports_events_not_stale 
  ON public.sports_events (match_status, is_stale) 
  WHERE is_stale = false;
