
-- Add missing columns to sports_events if they don't exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sports_events' AND column_name = 'round') THEN
    ALTER TABLE public.sports_events ADD COLUMN round text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sports_events' AND column_name = 'link_url') THEN
    ALTER TABLE public.sports_events ADD COLUMN link_url text;
  END IF;
END $$;

-- Create sports_sources_health table
CREATE TABLE IF NOT EXISTS public.sports_sources_health (
  source text PRIMARY KEY,
  last_success_at timestamp with time zone,
  last_error text,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.sports_sources_health ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read sports sources health"
  ON public.sports_sources_health FOR SELECT USING (true);

CREATE POLICY "Service role can manage sports sources health"
  ON public.sports_sources_health FOR ALL
  USING (auth.role() = 'service_role'::text)
  WITH CHECK (auth.role() = 'service_role'::text);

-- Insert default rows
INSERT INTO public.sports_sources_health (source) VALUES ('thesportsdb'), ('ergast'), ('manual')
ON CONFLICT DO NOTHING;

-- Create sports_manual_submissions table
CREATE TABLE IF NOT EXISTS public.sports_manual_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sport text NOT NULL DEFAULT 'basketball',
  team_tag text NOT NULL DEFAULT 'kk_zadar',
  home_team text NOT NULL,
  away_team text NOT NULL,
  start_time timestamp with time zone NOT NULL,
  venue text,
  competition text,
  link_url text,
  submitted_by_fingerprint text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.sports_manual_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read approved submissions"
  ON public.sports_manual_submissions FOR SELECT
  USING (status = 'approved' OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can submit sports events"
  ON public.sports_manual_submissions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can manage submissions"
  ON public.sports_manual_submissions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
