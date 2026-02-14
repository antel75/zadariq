
-- Table for cinema movies (one row per movie currently showing)
CREATE TABLE public.cinema_movies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  genre text,
  duration text,
  poster_url text,
  cinestar_url text,
  age_rating text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table for individual screenings (times per day)
CREATE TABLE public.cinema_screenings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  movie_id uuid NOT NULL REFERENCES public.cinema_movies(id) ON DELETE CASCADE,
  screening_date date NOT NULL,
  screening_time time NOT NULL,
  hall text,
  format text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cinema_movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cinema_screenings ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public can read cinema movies"
  ON public.cinema_movies FOR SELECT USING (true);

CREATE POLICY "Public can read cinema screenings"
  ON public.cinema_screenings FOR SELECT USING (true);

-- Admin manage
CREATE POLICY "Admins can manage cinema movies"
  ON public.cinema_movies FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage cinema screenings"
  ON public.cinema_screenings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Index for faster queries
CREATE INDEX idx_screenings_date ON public.cinema_screenings(screening_date);
CREATE INDEX idx_screenings_movie ON public.cinema_screenings(movie_id);

-- Timestamp trigger
CREATE TRIGGER update_cinema_movies_updated_at
  BEFORE UPDATE ON public.cinema_movies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
