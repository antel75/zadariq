
-- Add context_hash to daily_poll
ALTER TABLE public.daily_poll ADD COLUMN context_hash text;

-- Create poll_history archive table (preserves old polls + votes)
CREATE TABLE public.poll_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_poll_id uuid NOT NULL,
  question_text text NOT NULL,
  context_type text NOT NULL DEFAULT 'generic',
  context_key text NOT NULL DEFAULT 'calm',
  context_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expired_at timestamptz NOT NULL DEFAULT now(),
  expire_reason text NOT NULL DEFAULT 'context_change',
  total_votes integer NOT NULL DEFAULT 0
);

-- Enable RLS on poll_history
ALTER TABLE public.poll_history ENABLE ROW LEVEL SECURITY;

-- Public can read history
CREATE POLICY "Public can read poll history"
  ON public.poll_history FOR SELECT
  USING (true);

-- Service role can manage history
CREATE POLICY "Service role can manage poll history"
  ON public.poll_history FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
