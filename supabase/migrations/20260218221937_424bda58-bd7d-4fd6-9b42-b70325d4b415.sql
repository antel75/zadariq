
-- Table to track which Sundays a shop is open (max 16/year in Croatia)
CREATE TABLE public.shop_sunday_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id text NOT NULL,
  sunday_date date NOT NULL,
  open_time time without time zone DEFAULT '08:00',
  close_time time without time zone DEFAULT '21:00',
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(business_id, sunday_date)
);

-- Enable RLS
ALTER TABLE public.shop_sunday_schedule ENABLE ROW LEVEL SECURITY;

-- Admin can manage
CREATE POLICY "Admins can manage shop sunday schedule"
  ON public.shop_sunday_schedule FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Public can read
CREATE POLICY "Public can read shop sunday schedule"
  ON public.shop_sunday_schedule FOR SELECT
  USING (true);

-- Auto update timestamp
CREATE TRIGGER update_shop_sunday_schedule_updated_at
  BEFORE UPDATE ON public.shop_sunday_schedule
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
