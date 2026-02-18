import { useLanguage } from '@/contexts/LanguageContext';
import { BusinessCard } from '@/components/BusinessCard';
import { Business } from '@/data/types';
import { Sunrise, Sun, Sunset, Moon, MapPin } from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { useMorningRoutine, MorningSuggestion } from '@/hooks/useMorningRoutine';
import { businesses, isBusinessOpen } from '@/data/mockData';

type TimeSlot = 'morning' | 'noon' | 'evening' | 'night';

function getTimeSlot(): TimeSlot {
  const h = new Date().getHours();
  const m = new Date().getMinutes();
  const totalMin = h * 60 + m;
  // Morning engine: 05:30–10:30
  if (totalMin >= 330 && totalMin < 630) return 'morning';
  if (h >= 11 && h < 16) return 'noon';
  if (h >= 16 && h < 21) return 'evening';
  return 'night';
}

const slotConfig: Record<Exclude<TimeSlot, 'morning'>, { icon: LucideIcon; titleKey: string; categories: string[] }> = {
  noon: { icon: Sun, titleKey: 'foryou.noon', categories: ['restaurants', 'cafes'] },
  evening: { icon: Sunset, titleKey: 'foryou.evening', categories: ['cafes', 'restaurants'] },
  night: { icon: Moon, titleKey: 'foryou.night', categories: ['pharmacy'] },
};

interface ForYouSectionProps {
  onReport: (b: Business) => void;
}

/** Morning card with category label and distance */
function MorningSuggestionCard({ suggestion, onReport }: { suggestion: MorningSuggestion; onReport: (b: Business) => void }) {
  const { language } = useLanguage();
  const label = language === 'hr' ? suggestion.categoryLabel.hr : suggestion.categoryLabel.en;

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 px-1">
        <span className="text-[10px] font-semibold text-accent uppercase tracking-wide">{label}</span>
        {suggestion.distanceKm !== null && (
          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
            <MapPin className="h-2.5 w-2.5" />
            {suggestion.distanceKm < 1
              ? `${Math.round(suggestion.distanceKm * 1000)}m`
              : `${suggestion.distanceKm.toFixed(1)}km`}
          </span>
        )}
      </div>
      <BusinessCard business={suggestion.business} onReport={onReport} />
    </div>
  );
}

export function ForYouSection({ onReport }: ForYouSectionProps) {
  const { t, language } = useLanguage();
  const slot = getTimeSlot();
  const morningSuggestions = useMorningRoutine();

  // Morning: use the routine engine
  if (slot === 'morning') {
    if (morningSuggestions.length === 0) return null;

    return (
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Sunrise className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-semibold text-foreground">
            {language === 'hr' ? 'Jutarnji prijedlozi' : 'Morning picks'}
          </h2>
          <span className="text-[10px] text-muted-foreground ml-auto">
            {language === 'hr' ? 'mijenja se svaki dan' : 'changes daily'}
          </span>
        </div>
        <div className="flex flex-col gap-3">
          {morningSuggestions.map((s) => (
            <MorningSuggestionCard key={s.business.id} suggestion={s} onReport={onReport} />
          ))}
        </div>
      </div>
    );
  }

  // Other time slots: keep existing behaviour
  const config = slotConfig[slot];
  const Icon = config.icon;

  const suggested = businesses
    .filter((b) => config.categories.includes(b.category) && isBusinessOpen(b))
    .slice(0, 3);

  if (suggested.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-accent" />
        <h2 className="text-sm font-semibold text-foreground">{t(config.titleKey)}</h2>
      </div>
      <div className="flex flex-col gap-3">
        {suggested.map((b) => (
          <BusinessCard key={b.id} business={b} onReport={onReport} />
        ))}
      </div>
    </div>
  );
}
