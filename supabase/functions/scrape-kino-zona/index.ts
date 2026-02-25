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

    console.log('Fetching Kino Zona page...');
    const response = await fetch('https://www.kino-zona.com/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ZadarIQ/1.0)',
        'Accept': 'text/html',
        'Accept-Language': 'hr',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Kino Zona page: ${response.status}`);
    }

    const html = await response.text();
    console.log('Page fetched, parsing schedule...');

    const movies = parseSchedule(html);
    console.log(`Found ${movies.length} movies with screenings`);

    if (movies.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No movies found', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clear old data
    await supabase.from('kino_zona_screenings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('kino_zona_movies').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    let totalScreenings = 0;
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
  const currentYear = new Date().getFullYear();

  // Find all tab panels with schedule data
  const tabPanels = html.split('role="tabpanel"');
  
  for (let t = 1; t < tabPanels.length; t++) {
    const panel = tabPanels[t];
    
    // Extract date from the tab header - find matching tab
    // Tabs are like: "sri. 18.02.", "pet. 20.02."
    const tabHeaders = html.match(/class="section-title small capitalize">([^<]+)</g) || [];
    let dateStr: string | null = null;
    
    if (t <= tabHeaders.length) {
      const headerText = tabHeaders[t - 1].replace('class="section-title small capitalize">', '').trim();
      const dateMatch = headerText.match(/(\d{1,2})\.(\d{2})\./);
      if (dateMatch) {
        const day = parseInt(dateMatch[1]);
        const month = parseInt(dateMatch[2]);
        let year = currentYear;
        if (month < new Date().getMonth() + 1) year++;
        dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }

    if (!dateStr) continue;

    // Parse movies in this tab panel
    const movieBlocks = panel.split('blog-list-item');
    
    for (let i = 1; i < movieBlocks.length; i++) {
      const block = movieBlocks[i];

      // Extract title
      const titleMatch = block.match(/<h3 class="entry-title">([^<]+)<\/h3>/);
      if (!titleMatch) continue;
      const title = decodeHtml(titleMatch[1].trim());

      // Extract time
      const timeMatch = block.match(/list-categories">\s*<a[^>]*>(\d{2}:\d{2})<\/a>/);
      const time = timeMatch ? timeMatch[1] + ':00' : null;

      // Extract poster
      const posterMatch = block.match(/post-thumbnail[\s\S]*?<img src="([^"]+)"/);
      const posterUrl = posterMatch ? posterMatch[1] : null;

      // Extract URL
      const urlMatch = block.match(/href="(https:\/\/www\.kino-zona\.com\/filmovi\/[^"]+)"/);
      const url = urlMatch ? urlMatch[1] : null;

      // Extract trailer
      const trailerMatch = block.match(/trailer-play-button" href="([^"]+)"/);
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
          existing.screenings.push({ date: dateStr, time });
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
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—');
}
