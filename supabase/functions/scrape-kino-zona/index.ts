import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const FETCH_TIMEOUT_MS = 15_000;
const MIN_MOVIES_SAFETY = 2; // Don't wipe DB if fewer movies found than this

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Fetching Kino Zona page...');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch('https://www.kino-zona.com/', {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ZadarIQ/1.0)',
          'Accept': 'text/html',
          'Accept-Language': 'hr',
        },
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch Kino Zona page: ${response.status}`);
    }

    const html = await response.text();
    console.log(`Page fetched (${html.length} bytes), parsing schedule...`);

    if (html.length < 1000) {
      throw new Error('Page body too short, site may be down or returning error page');
    }

    const movies = parseSchedule(html);
    console.log(`Found ${movies.length} movies with screenings`);

    if (movies.length === 0) {
      console.log('No movies found — preserving existing data');
      return new Response(
        JSON.stringify({ success: true, message: 'No movies found, existing data preserved', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Safety: check current count before wiping
    const { count: existingCount } = await supabase
      .from('kino_zona_movies')
      .select('*', { count: 'exact', head: true });

    if (existingCount && existingCount > 0 && movies.length < MIN_MOVIES_SAFETY && movies.length < existingCount / 2) {
      console.warn(`Safety: only ${movies.length} movies found vs ${existingCount} existing. Skipping wipe.`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Safety check failed: found only ${movies.length} movies vs ${existingCount} existing. Site structure may have changed.` 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clear old data
    const { error: delScreenErr } = await supabase.from('kino_zona_screenings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (delScreenErr) console.error('Error deleting old screenings:', delScreenErr);

    const { error: delMovieErr } = await supabase.from('kino_zona_movies').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (delMovieErr) console.error('Error deleting old movies:', delMovieErr);

    let totalScreenings = 0;
    let insertedMovies = 0;

    for (const movie of movies) {
      const { data: inserted, error: movieError } = await supabase
        .from('kino_zona_movies')
        .insert({
          title: movie.title,
          genre: movie.genre,
          duration: movie.duration,
          country: movie.country,
          year: movie.year,
          poster_url: movie.posterUrl,
          kino_zona_url: movie.url,
          trailer_url: movie.trailerUrl,
          description: movie.description,
        })
        .select('id')
        .single();

      if (movieError) {
        console.error(`Error inserting movie ${movie.title}:`, movieError);
        continue;
      }

      insertedMovies++;

      if (movie.screenings.length > 0) {
        const rows = movie.screenings.map(s => ({
          movie_id: inserted.id,
          screening_date: s.date,
          screening_time: s.time,
        }));

        const { error: sErr } = await supabase.from('kino_zona_screenings').insert(rows);
        if (sErr) {
          console.error(`Error inserting screenings for ${movie.title}:`, sErr);
        } else {
          totalScreenings += rows.length;
        }
      }
    }

    console.log(`Done! ${insertedMovies} movies, ${totalScreenings} screenings`);
    return new Response(
      JSON.stringify({ success: true, movies: insertedMovies, screenings: totalScreenings }),
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
  country: string | null;
  year: string | null;
  posterUrl: string | null;
  url: string | null;
  trailerUrl: string | null;
  description: string | null;
  screenings: { date: string; time: string }[];
}

function parseSchedule(html: string): MovieData[] {
  const movies: MovieData[] = [];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-based

  // Find all tab panels with schedule data
  const tabPanels = html.split('role="tabpanel"');
  
  // Extract tab headers once
  const tabHeaders = html.match(/class="section-title small capitalize">([^<]+)/g) || [];

  for (let t = 1; t < tabPanels.length; t++) {
    const panel = tabPanels[t];
    
    let dateStr: string | null = null;
    
    if (t <= tabHeaders.length) {
      const headerText = tabHeaders[t - 1].replace('class="section-title small capitalize">', '').trim();
      const dateMatch = headerText.match(/(\d{1,2})\.(\d{2})\./);
      if (dateMatch) {
        const day = parseInt(dateMatch[1]);
        const month = parseInt(dateMatch[2]);
        // Handle year rollover: if month is before current month, it's next year
        let year = currentYear;
        if (month < currentMonth) year++;
        dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }

    if (!dateStr) continue;

    // Parse movies in this tab panel
    const movieBlocks = panel.split('blog-list-item');
    
    for (let i = 1; i < movieBlocks.length; i++) {
      const block = movieBlocks[i];

      // Extract title — try multiple patterns for resilience
      let title: string | null = null;
      const titleMatch = block.match(/<h3[^>]*class="entry-title"[^>]*>([^<]+)/);
      if (titleMatch) {
        title = decodeHtml(titleMatch[1].trim());
      } else {
        // Fallback: any h3 with content
        const h3Match = block.match(/<h3[^>]*>([^<]+)/);
        if (h3Match) title = decodeHtml(h3Match[1].trim());
      }
      if (!title) continue;

      // Extract time
      const timeMatch = block.match(/list-categories">\s*<a[^>]*>(\d{2}:\d{2})<\/a>/);
      const time = timeMatch ? timeMatch[1] + ':00' : null;

      // Extract poster
      const posterMatch = block.match(/post-thumbnail[\s\S]*?<img[^>]+src="([^"]+)"/);
      const posterUrl = posterMatch ? posterMatch[1] : null;

      // Extract URL
      const urlMatch = block.match(/href="(https:\/\/www\.kino-zona\.com\/filmovi\/[^"]+)"/);
      const url = urlMatch ? urlMatch[1] : null;

      // Extract trailer
      const trailerMatch = block.match(/trailer-play-button"[^>]*href="([^"]+)"/);
      const trailerUrl = trailerMatch ? trailerMatch[1] : null;

      // Extract genre
      const genreSection = block.match(/<div class="category">([\s\S]*?)<\/div>/);
      let genre: string | null = null;
      if (genreSection) {
        const genres = genreSection[1].match(/>([^<]+)<\/a>/g);
        if (genres) {
          genre = genres.map(g => g.replace(/>|<\/a>/g, '').trim()).filter(Boolean).join(', ');
        }
      }

      // Extract meta (country, year, duration)
      const countryMatch = block.match(/class="view">([^<]+)<\/span>/);
      const yearMatch = block.match(/class="like">([^<]+)<\/span>/);
      const durationMatch = block.match(/class="comment">([^<]+)<\/span>/);

      const country = countryMatch ? countryMatch[1].trim() : null;
      const year = yearMatch ? yearMatch[1].replace('.', '').trim() : null;
      const duration = durationMatch ? durationMatch[1].trim() : null;

      // Extract description
      const descMatch = block.match(/class="entry-content">([^<]+(?:<[^>]+>[^<]*)*)/);
      const description = descMatch ? decodeHtml(descMatch[1].replace(/<[^>]+>/g, '').trim()).substring(0, 500) : null;

      // Check if movie already exists in our list
      const existing = movies.find(m => m.title === title);
      if (existing) {
        if (time && dateStr) {
          // Avoid duplicate screenings
          const alreadyHas = existing.screenings.some(s => s.date === dateStr && s.time === time);
          if (!alreadyHas) {
            existing.screenings.push({ date: dateStr, time });
          }
        }
      } else {
        const screenings: { date: string; time: string }[] = [];
        if (time && dateStr) {
          screenings.push({ date: dateStr, time });
        }
        movies.push({
          title, genre, duration, country, year,
          posterUrl, url, trailerUrl, description, screenings,
        });
      }
    }
  }

  return movies;
}

function decodeHtml(text: string): string {
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
    .replace(/&auml;/g, 'ä')
    .replace(/&nbsp;/g, ' ');
}
