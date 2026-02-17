
-- Daily polls table
CREATE TABLE public.daily_poll (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_text TEXT NOT NULL,
  context_type TEXT NOT NULL DEFAULT 'generic',
  context_key TEXT NOT NULL DEFAULT 'calm',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

ALTER TABLE public.daily_poll ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active polls"
ON public.daily_poll FOR SELECT
USING (expires_at > now());

CREATE POLICY "Service role can manage polls"
ON public.daily_poll FOR ALL
USING (auth.role() = 'service_role'::text)
WITH CHECK (auth.role() = 'service_role'::text);

-- Poll options table
CREATE TABLE public.poll_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES public.daily_poll(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  votes_count INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read poll options"
ON public.poll_options FOR SELECT
USING (true);

CREATE POLICY "Service role can manage poll options"
ON public.poll_options FOR ALL
USING (auth.role() = 'service_role'::text)
WITH CHECK (auth.role() = 'service_role'::text);

-- Poll votes table
CREATE TABLE public.poll_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES public.daily_poll(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES public.poll_options(id) ON DELETE CASCADE,
  fingerprint_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

-- Unique constraint: one vote per fingerprint per poll
ALTER TABLE public.poll_votes ADD CONSTRAINT poll_votes_fingerprint_poll_unique UNIQUE (fingerprint_hash, poll_id);

CREATE POLICY "Anyone can insert poll votes"
ON public.poll_votes FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public can read poll votes"
ON public.poll_votes FOR SELECT
USING (true);

CREATE POLICY "Service role can manage poll votes"
ON public.poll_votes FOR ALL
USING (auth.role() = 'service_role'::text)
WITH CHECK (auth.role() = 'service_role'::text);

-- Function to increment vote count atomically
CREATE OR REPLACE FUNCTION public.increment_poll_vote(p_option_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE poll_options SET votes_count = votes_count + 1 WHERE id = p_option_id;
END;
$$;
