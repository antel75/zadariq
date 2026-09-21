ALTER TABLE public.shop_sunday_schedule
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS source_url text,
  ADD COLUMN IF NOT EXISTS fetched_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS shop_sunday_schedule_business_date_uniq
  ON public.shop_sunday_schedule (business_id, sunday_date);

CREATE TABLE IF NOT EXISTS public.sunday_scrape_status (
  id text PRIMARY KEY,
  last_run_at timestamptz NOT NULL DEFAULT now(),
  ok boolean NOT NULL DEFAULT true,
  message text,
  sunday_date date,
  source_url text,
  parsed_count integer NOT NULL DEFAULT 0,
  matched_count integer NOT NULL DEFAULT 0,
  created_count integer NOT NULL DEFAULT 0,
  skipped_count integer NOT NULL DEFAULT 0,
  consecutive_failures integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.sunday_scrape_status TO anon, authenticated;
GRANT ALL ON public.sunday_scrape_status TO service_role;

ALTER TABLE public.sunday_scrape_status ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read sunday scrape status" ON public.sunday_scrape_status;
CREATE POLICY "Public can read sunday scrape status"
  ON public.sunday_scrape_status FOR SELECT
  USING (true);