import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Calendar, MapPin, ExternalLink, Loader2 } from 'lucide-react';
import { Footer } from '@/components/Footer';
import { format, parseISO, isToday, isTomorrow, isPast } from 'date-fns';
import { hr } from 'date-fns/locale';

interface CityEvent {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  venue: string | null;
  event_date_from: string | null;
  event_date_to: string | null;
  image_url: string | null;
  website_url: string | null;
  category: string | null;
  region: string | null;
  source: string | null;
}

type RegionFilter = 'all' | 'zadar' | 'zrce' | 'tisno';
type CategoryFilter = 'all' | 'kultura' | 'nocni-zivot' | 'festival' | 'festa' | 'sport' | 'koncerti' | 'gastro' | 'izlozbe';

const REGION_LABELS: Record<RegionFilter, Record<string, string>> = {
  all:    { hr: 'Sve', en: 'All', de: 'Alle', it: 'Tutti' },
  zadar:  { hr: 'Zadar', en: 'Zadar', de: 'Zadar', it: 'Zadar' },
  zrce:   { hr: 'Zrće', en: 'Zrće', de: 'Zrće', it: 'Zrće' },
  tisno:  { hr: 'Tisno', en: 'Tisno', de: 'Tisno', it: 'Tisno' },
};

const CATEGORY_LABELS: Record<CategoryFilter, Record<string, string>> = {
  all:           { hr: 'Sve',           en: 'All',          de: 'Alle',           it: 'Tutti' },
  kultura:       { hr: '🎭 Kultura',    en: '🎭 Culture',   de: '🎭 Kultur',      it: '🎭 Cultura' },
  'nocni-zivot': { hr: '🎉 Noćni život',en: '🎉 Nightlife', de: '🎉 Nachtleben',  it: '🎉 Vita notturna' },
  festival:      { hr: '🎪 Festivali',  en: '🎪 Festivals', de: '🎪 Festivals',   it: '🎪 Festival' },
  festa:         { hr: '🎊 Fešte',      en: '🎊 Feasts',    de: '🎊 Feste',       it: '🎊 Feste' },
  sport:         { hr: '🏃 Sport',      en: '🏃 Sport',     de: '🏃 Sport',       it: '🏃 Sport' },
  koncerti:      { hr: '🎵 Koncerti',   en: '🎵 Concerts',  de: '🎵 Konzerte',    it: '🎵 Concerti' },
  gastro:        { hr: '🍷 Gastro',     en: '🍷 Gastro',    de: '🍷 Gastro',      it: '🍷 Gastro' },
  izlozbe:       { hr: '🎨 Izložbe',    en: '🎨 Exhibitions',de: '🎨 Ausstellungen',it: '🎨 Mostre' },
};

const CATEGORY_COLORS: Record<string, string> = {
  kultura:       'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'nocni-zivot': 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  festival:      'bg-orange-500/10 text-orange-400 border-orange-500/20',
  festa:         'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  sport:         'bg-green-500/10 text-green-400 border-green-500/20',
  koncerti:      'bg-blue-500/10 text-blue-400 border-blue-500/20',
  gastro:        'bg-red-500/10 text-red-400 border-red-500/20',
  izlozbe:       'bg-teal-500/10 text-teal-400 border-teal-500/20',
};

function formatDateRange(from: string | null, to: string | null, lang: string): string {
  if (!from) return '';
  try {
    const fromDate = parseISO(from);
    const locale = lang === 'hr' ? hr : undefined;
    if (!to || from === to) {
      if (isToday(fromDate)) return lang === 'hr' ? 'Danas' : 'Today';
      if (isTomorrow(fromDate)) return lang === 'hr' ? 'Sutra' : 'Tomorrow';
      return format(fromDate, 'd. MMM yyyy.', { locale });
    }
    const toDate = parseISO(to);
    return `${format(fromDate, 'd. MMM', { locale })} — ${format(toDate, 'd. MMM yyyy.', { locale })}`;
  } catch {
    return from;
  }
}

function isEventUpcoming(event: CityEvent): boolean {
  const dateStr = event.event_date_to || event.event_date_from;
  if (!dateStr) return true;
  try {
    return !isPast(parseISO(dateStr));
  } catch {
    return true;
  }
}

const Events = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [regionFilter, setRegionFilter] = useState<RegionFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');

  const { data: events, isLoading } = useQuery({
    queryKey: ['city-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('city_events')
        .select('*')
        .order('event_date_from', { ascending: true });
      if (error) throw error;
      return data as CityEvent[];
    },
    staleTime: 10 * 60 * 1000,
  });

  const filtered = (events || [])
    .filter(isEventUpcoming)
    .filter(e => regionFilter === 'all' || e.region === regionFilter)
    .filter(e => categoryFilter === 'all' || e.category === categoryFilter);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-foreground">Što se događa?</h1>
              <p className="text-[11px] text-muted-foreground">Eventi u zadarskoj regiji</p>
            </div>
          </div>
          <LanguageSelector />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pb-8">
        <section className="mt-4 mb-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(Object.keys(REGION_LABELS) as RegionFilter[]).map(r => (
              <button key={r} onClick={() => setRegionFilter(r)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${regionFilter === r ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                {REGION_LABELS[r][language] || REGION_LABELS[r].hr}
              </button>
            ))}
          </div>
        </section>

        <section className="mb-4">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(Object.keys(CATEGORY_LABELS) as CategoryFilter[]).map(c => (
              <button key={c} onClick={() => setCategoryFilter(c)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${categoryFilter === c ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                {CATEGORY_LABELS[c][language] || CATEGORY_LABELS[c].hr}
              </button>
            ))}
          </div>
        </section>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">Nema pronađenih evenata.</div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(event => (
              <div key={event.id} className="rounded-2xl bg-card border border-border overflow-hidden">
                {event.image_url && (
                  <div className="w-full h-36 overflow-hidden">
                    <img src={event.image_url} alt={event.title} className="w-full h-full object-cover"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  </div>
                )}
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="text-sm font-bold text-foreground leading-tight flex-1">{event.title}</h3>
                    {event.category && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 ${CATEGORY_COLORS[event.category] || 'bg-secondary text-secondary-foreground border-border'}`}>
                        {CATEGORY_LABELS[event.category as CategoryFilter]?.[language] || event.category}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                    {event.event_date_from && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDateRange(event.event_date_from, event.event_date_to, language)}
                      </span>
                    )}
                    {(event.venue || event.location) && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {event.venue || event.location}
                      </span>
                    )}
                  </div>
                  {event.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{event.description}</p>
                  )}
                  {event.website_url && (
                    <a href={event.website_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-primary font-medium hover:underline">
                      <ExternalLink className="h-3 w-3" />
                      Više informacija
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Events;
