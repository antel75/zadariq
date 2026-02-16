import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Clock, MapPin, Film, Calendar, ExternalLink, Loader2 } from 'lucide-react';
import { Footer } from '@/components/Footer';
import { format, parseISO, isToday, isTomorrow, addDays } from 'date-fns';
import { hr } from 'date-fns/locale';

interface CinemaMovie {
  id: string;
  title: string;
  genre: string | null;
  duration: string | null;
  poster_url: string | null;
  cinestar_url: string | null;
  age_rating: string | null;
  description: string | null;
}

interface CinemaScreening {
  id: string;
  movie_id: string;
  screening_date: string;
  screening_time: string;
  hall: string | null;
  format: string | null;
}

type DayFilter = 'today' | 'tomorrow' | 'week';

export default function Cinema() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [dayFilter, setDayFilter] = useState<DayFilter>('today');
  const [expandedMovie, setExpandedMovie] = useState<string | null>(null);

  const { data: movies, isLoading: moviesLoading } = useQuery({
    queryKey: ['cinema-movies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cinema_movies')
        .select('*')
        .order('title');
      if (error) throw error;
      return data as CinemaMovie[];
    },
  });

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const tomorrowStr = format(addDays(new Date(), 1), 'yyyy-MM-dd');
  const weekEndStr = format(addDays(new Date(), 7), 'yyyy-MM-dd');

  const { data: screenings, isLoading: screeningsLoading } = useQuery({
    queryKey: ['cinema-screenings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cinema_screenings')
        .select('*')
        .gte('screening_date', todayStr)
        .lte('screening_date', weekEndStr)
        .order('screening_date')
        .order('screening_time');
      if (error) throw error;
      return data as CinemaScreening[];
    },
  });

  const isLoading = moviesLoading || screeningsLoading;

  const filteredMovies = useMemo(() => {
    if (!movies || !screenings) return [];

    let dateFilter: (date: string) => boolean;
    if (dayFilter === 'today') {
      dateFilter = (d) => d === todayStr;
    } else if (dayFilter === 'tomorrow') {
      dateFilter = (d) => d === tomorrowStr;
    } else {
      dateFilter = (d) => d >= todayStr && d <= weekEndStr;
    }

    const filteredScreenings = screenings.filter(s => dateFilter(s.screening_date));
    const movieIds = new Set(filteredScreenings.map(s => s.movie_id));

    return movies
      .filter(m => movieIds.has(m.id))
      .map(m => ({
        ...m,
        screenings: filteredScreenings.filter(s => s.movie_id === m.id),
      }));
  }, [movies, screenings, dayFilter, todayStr, tomorrowStr, weekEndStr]);

  const formatDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return language === 'hr' ? 'Danas' : 'Today';
    if (isTomorrow(date)) return language === 'hr' ? 'Sutra' : 'Tomorrow';
    return format(date, 'EEE dd.MM.', { locale: language === 'hr' ? hr : undefined });
  };

  const groupScreeningsByDate = (movieScreenings: CinemaScreening[]) => {
    const groups: Record<string, CinemaScreening[]> = {};
    for (const s of movieScreenings) {
      if (!groups[s.screening_date]) groups[s.screening_date] = [];
      groups[s.screening_date].push(s);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-4 pt-12 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">🎬 CineStar Zadar</h1>
            <p className="text-xs text-primary-foreground/70">City Galleria</p>
          </div>
        </div>

        {/* Day filter */}
        <div className="flex gap-2">
          {(['today', 'tomorrow', 'week'] as DayFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setDayFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                dayFilter === f
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-white/15 text-primary-foreground/80 hover:bg-white/25'
              }`}
            >
              {f === 'today' ? (language === 'hr' ? 'Danas' : 'Today')
                : f === 'tomorrow' ? (language === 'hr' ? 'Sutra' : 'Tomorrow')
                : (language === 'hr' ? 'Tjedan' : 'Week')}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 mt-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-accent" />
          </div>
        ) : filteredMovies.length === 0 ? (
          <div className="text-center py-16">
            <Film className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground text-sm">
              {language === 'hr' ? 'Nema projekcija za odabrani period' : 'No screenings for selected period'}
            </p>
            <p className="text-muted-foreground/60 text-xs mt-1">
              {language === 'hr' ? 'Repertoar se ažurira tjedno' : 'Schedule is updated weekly'}
            </p>
          </div>
        ) : (
          filteredMovies.map(movie => {
            const isExpanded = expandedMovie === movie.id;
            const screeningGroups = groupScreeningsByDate(movie.screenings);

            return (
              <div key={movie.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                <div
                  className="flex gap-3 p-3 cursor-pointer"
                  onClick={() => setExpandedMovie(isExpanded ? null : movie.id)}
                >
                  {/* Poster */}
                  {movie.poster_url ? (
                    <img
                      src={movie.poster_url}
                      alt={movie.title}
                      className="w-16 h-24 rounded-lg object-cover flex-shrink-0"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-16 h-24 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Film className="w-6 h-6 text-muted-foreground/40" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-foreground leading-tight">{movie.title}</h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {movie.genre && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
                          {movie.genre}
                        </span>
                      )}
                      {movie.duration && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <Clock className="w-3 h-3" /> {movie.duration}
                        </span>
                      )}
                      {movie.age_rating && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive font-medium">
                          {movie.age_rating}
                        </span>
                      )}
                    </div>

                    {/* Show today's times inline */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {movie.screenings.slice(0, 5).map(s => (
                        <span
                          key={s.id}
                          className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-md"
                        >
                          {s.screening_time.substring(0, 5)}
                        </span>
                      ))}
                      {movie.screenings.length > 5 && (
                        <span className="text-xs text-muted-foreground">+{movie.screenings.length - 5}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-border px-3 py-3 space-y-3 bg-muted/30">
                    {movie.description && (
                      <p className="text-xs text-muted-foreground leading-relaxed">{movie.description}</p>
                    )}

                    {/* Screenings grouped by date */}
                    {screeningGroups.map(([date, dateScreenings]) => (
                      <div key={date}>
                        <p className="text-[11px] font-semibold text-foreground/70 mb-1">
                          {formatDateLabel(date)}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {dateScreenings.map(s => (
                            <div key={s.id} className="text-center">
                              <div className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-lg">
                                {s.screening_time.substring(0, 5)}
                              </div>
                              {s.hall && (
                                <p className="text-[9px] text-muted-foreground mt-0.5">{s.hall}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    {/* CineStar link */}
                    {movie.cinestar_url && (
                      <a
                        href={movie.cinestar_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-accent font-medium hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {language === 'hr' ? 'Kupi ulaznice na CineStar.hr' : 'Buy tickets on CineStar.hr'}
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer info */}
      <div className="px-4 mt-6 text-center">
        <p className="text-[10px] text-muted-foreground/50">
          {language === 'hr'
            ? 'Podaci se automatski ažuriraju s cinestarcinemas.hr'
            : 'Data is automatically updated from cinestarcinemas.hr'}
        </p>
      </div>
      <Footer />
    </div>
  );
}
