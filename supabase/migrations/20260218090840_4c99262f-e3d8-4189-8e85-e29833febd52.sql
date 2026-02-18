
-- Table for admin overrides of business working hours
CREATE TABLE public.business_hours_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id text NOT NULL,
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sun, 6=Sat
  open_time time WITHOUT TIME ZONE,
  close_time time WITHOUT TIME ZONE,
  is_closed boolean NOT NULL DEFAULT false,
  notes text,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, day_of_week)
);

ALTER TABLE public.business_hours_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage business hours overrides"
ON public.business_hours_overrides
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can read business hours overrides"
ON public.business_hours_overrides
FOR SELECT
USING (true);

CREATE TRIGGER update_business_hours_overrides_updated_at
BEFORE UPDATE ON public.business_hours_overrides
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
