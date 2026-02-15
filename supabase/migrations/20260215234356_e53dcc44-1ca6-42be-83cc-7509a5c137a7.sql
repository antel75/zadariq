
-- Create Kino Zona movies table
CREATE TABLE public.kino_zona_movies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  genre TEXT NULL,
  duration TEXT NULL,
  country TEXT NULL,
  year TEXT NULL,
  poster_url TEXT NULL,
  kino_zona_url TEXT NULL,
  trailer_url TEXT NULL,
  description TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Kino Zona screenings table
CREATE TABLE public.kino_zona_screenings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  movie_id UUID NOT NULL REFERENCES public.kino_zona_movies(id) ON DELETE CASCADE,
  screening_date TEXT NOT NULL,
  screening_time TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.kino_zona_movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kino_zona_screenings ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can read kino zona movies" ON public.kino_zona_movies FOR SELECT USING (true);
CREATE POLICY "Anyone can read kino zona screenings" ON public.kino_zona_screenings FOR SELECT USING (true);
