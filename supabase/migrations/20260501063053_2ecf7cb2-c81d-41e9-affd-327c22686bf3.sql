
CREATE TABLE public.public_holidays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  holiday_date date NOT NULL UNIQUE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.public_holidays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view holidays"
ON public.public_holidays FOR SELECT
USING (true);

CREATE POLICY "Admins manage holidays"
ON public.public_holidays FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.public_holidays (holiday_date, name) VALUES
('2026-01-01','Nova godina'),
('2026-01-06','Sveta tri kralja'),
('2026-04-05','Uskrs'),
('2026-04-06','Uskrsni ponedjeljak'),
('2026-05-01','Praznik rada'),
('2026-05-30','Dan državnosti'),
('2026-06-04','Tijelovo'),
('2026-06-22','Dan antifašističke borbe'),
('2026-08-05','Dan pobjede i domovinske zahvalnosti'),
('2026-08-15','Velika Gospa'),
('2026-11-01','Svi sveti'),
('2026-11-18','Dan sjećanja na žrtve Domovinskog rata'),
('2026-12-25','Božić'),
('2026-12-26','Sveti Stjepan'),
('2027-01-01','Nova godina'),
('2027-01-06','Sveta tri kralja'),
('2027-03-28','Uskrs'),
('2027-03-29','Uskrsni ponedjeljak'),
('2027-05-01','Praznik rada'),
('2027-05-06','Tijelovo'),
('2027-05-30','Dan državnosti'),
('2027-06-22','Dan antifašističke borbe'),
('2027-08-05','Dan pobjede i domovinske zahvalnosti'),
('2027-08-15','Velika Gospa'),
('2027-11-01','Svi sveti'),
('2027-11-18','Dan sjećanja na žrtve Domovinskog rata'),
('2027-12-25','Božić'),
('2027-12-26','Sveti Stjepan');
