import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Fetching CineStar Zadar page...');
    const response = await fetch('https://cinestarcinemas.hr/zadar-city-galleria', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ZadarIQ/1.0)',
        'Accept': 'text/html',
        'Accept-Language': 'hr',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch CineStar page: ${response.status}`);
    }

    const html = await response.text();
    console.log('Page fetched, parsing movies...');

    // Parse movies from HTML
    const movies = parseMovies(html);
    console.log(`Found ${movies.length} movies`);

    if (movies.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No movies found', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clear old data (screenings first due to FK, then movies)
    await supabase.from('cinema_screenings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('cinema_movies').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Insert movies and screenings
    let totalScreenings = 0;
    for (const movie of movies) {
      const { data: insertedMovie, error: movieError } = await supabase
        .from('cinema_movies')
        .insert({
          title: movie.title,
          genre: movie.genre,
          duration: movie.duration,
          poster_url: movie.posterUrl,
          cinestar_url: movie.url,
          age_rating: movie.ageRating,
          description: movie.description,
        })
        .select('id')
        .single();

      if (movieError) {
        console.error(`Error inserting movie ${movie.title}:`, movieError);
        continue;
      }

      if (movie.screenings.length > 0) {
        const screeningRows = movie.screenings.map(s => ({
          movie_id: insertedMovie.id,
          screening_date: s.date,
          screening_time: s.time,
          hall: s.hall,
          format: s.format,
        }));

        const { error: screenError } = await supabase
          .from('cinema_screenings')
          .insert(screeningRows);

        if (screenError) {
          console.error(`Error inserting screenings for ${movie.title}:`, screenError);
        } else {
          totalScreenings += screeningRows.length;
        }
      }
    }

    console.log(`Done! ${movies.length} movies, ${totalScreenings} screenings`);

    return new Response(
      JSON.stringify({ success: true, movies: movies.length, screenings: totalScreenings }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Scrape error:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

interface MovieData {
  title: string;
  genre: string | null;
  duration: string | null;
  posterUrl: string | null;
  url: string | null;
  ageRating: string | null;
  description: string | null;
  screenings: { date: string; time: string; hall: string | null; format: string | null }[];
}

function parseMovies(html: string): MovieData[] {
  const movies: MovieData[] = [];

  // Split by movie-item divs
  const movieBlocks = html.split('class="movie-item');
  
  for (let i = 1; i < movieBlocks.length; i++) {
    const block = movieBlocks[i];
    
    // Extract genre from data-genre
    const genreMatch = block.match(/data-genre="([^"]+)"/);
    const genre = genreMatch ? genreMatch[1] : null;

    // Extract format from data-format
    const formatMatch = block.match(/data-format="([^"]+)"/);
    const format = formatMatch ? formatMatch[1] : null;

    // Extract title from h2
    const titleMatch = block.match(/<h2>([^<]+)<\/h2>/);
    if (!titleMatch) continue;
    const title = decodeHtmlEntities(titleMatch[1].trim());

    // Extract poster URL
    const posterMatch = block.match(/class="img-fluid"\s*>\s*$|src="([^"]+)"\s+alt="[^"]*"\s+class="img-fluid"/);
    const posterMatch2 = block.match(/src="(https?:\/\/[^"]+(?:\.jpg|\.png|\.webp)[^"]*)"\s+alt=/);
    const posterUrl = posterMatch2 ? posterMatch2[1] : null;

    // Extract URL
    const urlMatch = block.match(/href="(https:\/\/cinestarcinemas\.hr\/zadar-city-galleria\/[^"]+)"/);
    const url = urlMatch ? urlMatch[1] : null;

    // Extract age rating
    const ageMatch = block.match(/alt="([^"]*godina[^"]*)"/i) || block.match(/alt="(Iznad [^"]+)"/);
    const ageRating = ageMatch ? ageMatch[1] : null;

    // Extract duration
    const durationMatch = block.match(/class="duration">([^<]+)<\/div>/);
    const duration = durationMatch ? durationMatch[1].trim() : null;

    // Extract description
    const descMatch = block.match(/<p>([^<]{20,})<\/p>/);
    const description = descMatch ? decodeHtmlEntities(descMatch[1].trim()).substring(0, 500) : null;

    // Extract screenings
    const screenings: MovieData['screenings'] = [];
    const dayBlocks = block.split('class="day-wrapper"');
    
    for (let j = 1; j < dayBlocks.length; j++) {
      const dayBlock = dayBlocks[j];
      
      // Extract date from day text like "DANAS, 14.02." or "SUTRA, 15.02." or "ponedjeljak, 16.02."
      const dayMatch = dayBlock.match(/class="day">([^<]+)<\/div>/);
      if (!dayMatch) continue;
      
      const dayText = dayMatch[1].trim();
      const dateStr = parseDateFromDayText(dayText);
      if (!dateStr) continue;

      // Extract times from perf elements
      const perfRegex = /class="time">(\d{2}:\d{2})<\/div>\s*<div class="venue">([^<]*)<\/div>/g;
      let perfMatch;
      while ((perfMatch = perfRegex.exec(dayBlock)) !== null) {
        screenings.push({
          date: dateStr,
          time: perfMatch[1] + ':00',
          hall: perfMatch[2].trim() || null,
          format: format,
        });
      }
    }

    movies.push({
      title,
      genre,
      duration,
      posterUrl,
      url,
      ageRating,
      description,
      screenings,
    });
  }

  return movies;
}

function parseDateFromDayText(text: string): string | null {
  // Try to find DD.MM. pattern
  const dateMatch = text.match(/(\d{1,2})\.(\d{2})\./);
  if (dateMatch) {
    const day = parseInt(dateMatch[1]);
    const month = parseInt(dateMatch[2]);
    const now = new Date();
    let year = now.getFullYear();
    // If month is less than current month, assume next year
    if (month < now.getMonth() + 1) {
      year++;
    }
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  return null;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_m, code) => String.fromCharCode(parseInt(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_m, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&uuml;/g, 'ü')
    .replace(/&ouml;/g, 'ö')
    .replace(/&auml;/g, 'ä');
}
