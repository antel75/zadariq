
-- Table for community smoking status reports on cafes
CREATE TABLE public.cafe_smoking_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id text NOT NULL,
  fingerprint_hash text NOT NULL,
  ip_hash text,
  report_value text NOT NULL CHECK (report_value IN ('allowed', 'partial', 'not_allowed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cafe_smoking_reports ENABLE ROW LEVEL SECURITY;

-- Anyone can read aggregated (we'll aggregate in app code)
CREATE POLICY "Anyone can read smoking reports"
  ON public.cafe_smoking_reports FOR SELECT
  USING (true);

-- Anyone can insert smoking reports
CREATE POLICY "Anyone can insert smoking reports"
  ON public.cafe_smoking_reports FOR INSERT
  WITH CHECK (true);

-- No update/delete for regular users

-- Table for community-submitted pending places (cafes)
CREATE TABLE public.pending_places (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proposed_name text NOT NULL,
  proposed_address text NOT NULL,
  lat double precision,
  lng double precision,
  phone text,
  website text,
  category text NOT NULL DEFAULT 'cafes',
  proposed_smoking_status text CHECK (proposed_smoking_status IN ('allowed', 'partial', 'not_allowed')),
  fingerprint_hash text NOT NULL,
  ip_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'shadow_rejected')),
  notes text,
  reviewed_by uuid,
  reviewed_at timestamptz
);

-- Enable RLS
ALTER TABLE public.pending_places ENABLE ROW LEVEL SECURITY;

-- Admins can manage all pending places
CREATE POLICY "Admins can manage pending_places"
  ON public.pending_places FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can insert pending places
CREATE POLICY "Anyone can submit pending places"
  ON public.pending_places FOR INSERT
  WITH CHECK (true);

-- Anyone can read their own submissions (by fingerprint - but we'll just let admins read all)
-- Public can see approved count for trust (optional)
CREATE POLICY "Public can read approved pending places"
  ON public.pending_places FOR SELECT
  USING (status = 'approved' OR has_role(auth.uid(), 'admin'::app_role));
