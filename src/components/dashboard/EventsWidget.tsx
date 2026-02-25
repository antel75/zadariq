import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const CATEGORIES = [
  { key: 'kultura',      emoji: '🎭', label: { hr: 'Kultura',      en: 'Culture',     de: 'Kultur',      it: 'Cultura'   }, bg: 'bg-purple-500/15', border: 'border-purple-500/30', text: 'text-purple-400' },
  { key: 'nocni-zivot', emoji: '🎉', label: { hr: 'Noćni život',  en: 'Nightlife',   de: 'Nachtleben',  it: 'Vita nott.'}, bg: 'bg-pink-500/15',   border: 'border-pink-500/30',   text: 'text-pink-400'   },
  { key: 'festival',    emoji: '🎪', label: { hr: 'Festivali',    en: 'Festivals',   de: 'Festivals',   it: 'Festival'  }, bg: 'bg-orange-500/15', border: 'border-orange-500/30', text: 'text-orange-400' },
  { key: 'festa',       emoji: '🎊', label: { hr: 'Fešte',        en: 'Feasts',      de: 'Feste',       it: 'Feste'     }, bg: 'bg-yellow-500/15', border: 'border-yellow-500/30', text: 'text-yellow-400' },
  { key: 'sport',       emoji: '🏃', label: { hr: 'Sport',        en: 'Sport',       de: 'Sport',       it: 'Sport'     }, bg: 'bg-green-500/15',  border: 'border-green-500/30',  text: 'text-green-400'  },
  { key: 'koncerti',    emoji: '🎵', label: { hr: 'Koncerti',     en: 'Concerts',    de: 'Konzerte',    it: 'Concerti'  }, bg: 'bg-blue-500/15',   border: 'border-blue-500/30',   text: 'text-blue-400'   },
  { key: 'gastro',      emoji: '🍷', label: { hr: 'Gastro',       en: 'Gastro',      de: 'Gastro',      it: 'Gastro'    }, bg: 'bg-red-500/15',    border: 'border-red-500/30',    text: 'text-red-400'    },
  { key: 'izlozbe',     emoji: '🎨', label: { hr: 'Izložbe',      en: 'Exhibitions', de: 'Ausstellungen',it: 'Mostre'   }, bg: 'bg-teal-500/15',   border: 'border-teal-500/30',   text: 'text-teal-400'   },
];

export function EventsWidget() {
  const navigate = useNavigate();
  const { language } = useLanguage();

  const { data: counts } = useQuery({
    queryKey: ['events-category-counts'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('city_events')
        .select('category')
        .gte('event_date_to', today);
      const map: Record<string, number> = {};
      for (const row of data || []) {
        if (row.category) map[row.category] = (map[row.category] || 0) + 1;
      }
      return map;
    },
    staleTime: 10 * 60 * 1000,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-foreground">📅 Događanja</h2>
        <button
          onClick={() => navigate('/events')}
          className="text-xs text-accent font-medium hover:underline"
        >
          Svi eventi →
        </button>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {CATEGORIES.map(cat => {
          const count = counts?.[cat.key] || 0;
          return (
            <button
              key={cat.key}
              onClick={() => navigate(`/events?category=${cat.key}`)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border ${cat.bg} ${cat.border} hover:scale-105 active:scale-95 transition-all duration-150`}
            >
              <span className="text-2xl">{cat.emoji}</span>
              <span className={`text-[10px] font-semibold text-center leading-tight ${cat.text}`}>
                {cat.label[language as keyof typeof cat.label] || cat.label.hr}
              </span>
              {count > 0 && (
                <span className={`text-[9px] font-bold ${cat.text} opacity-70`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
