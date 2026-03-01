
CREATE TABLE public.business_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id text NOT NULL,
  owner_user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  valid_from date NOT NULL DEFAULT CURRENT_DATE,
  valid_to date NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.business_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can read own offers"
  ON public.business_offers FOR SELECT
  USING (auth.uid() = owner_user_id);

CREATE POLICY "Owner can insert own offers"
  ON public.business_offers FOR INSERT
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Owner can update own offers"
  ON public.business_offers FOR UPDATE
  USING (auth.uid() = owner_user_id);

CREATE POLICY "Owner can delete own offers"
  ON public.business_offers FOR DELETE
  USING (auth.uid() = owner_user_id);

CREATE POLICY "Public can read active offers"
  ON public.business_offers FOR SELECT
  USING (active = true AND CURRENT_DATE BETWEEN valid_from AND valid_to);
