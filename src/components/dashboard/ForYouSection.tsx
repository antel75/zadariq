import { useLanguage } from '@/contexts/LanguageContext';
import { BusinessCard } from '@/components/BusinessCard';
import { Business } from '@/data/types';
import { Sunrise, Sun, Sunset, Moon } from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { useMorningRoutine, MorningSuggestion } from '@/hooks/useMorningRoutine';
import { businesses, isBusinessOpen } from '@/data/mockData';
import { getZadarHour } from '@/hooks/useSituationalMode';
import { useMemo, useState, useEffect } from 'react';

type TimeSlot = 'morning' | 'noon' | 'evening' | 'night';

function getTimeSlot(): TimeSlot {
  const h = getZadarHour();
  const m = parseInt(new Date().toLocaleString('en-US', { timeZone: 'Europe/Zagreb', minute: 'numeric' }), 10);
  const totalMin = h * 60 + m;
  if (totalMin >= 330 && totalMin < 630) return 'morning';
  if (h >= 11 && h < 16) return 'noon';
  if (h >= 16 && h < 21) return 'evening';
  return 'night';
}

/** Deterministic seeded PRNG (mulberry32) */
function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Returns a rotation seed that changes every 30 minutes, deterministic per day+slot */
function getRotationSeed(): number {
  const now = new Date();
  const zagreb = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Zagreb' }));
  const dayOfYear = Math.floor((zagreb.getTime() - new Date(zagreb.getFullYear(), 0, 0).getTime()) / 86400000);
  const halfHourSlot = Math.floor((zagreb.getHours() * 60 + zagreb.getMinutes()) / 30);
  return dayOfYear * 100 + halfHourSlot;
}

/** Deterministic shuffle */
function seededShuffle<T>(arr: T[], rng: () => number): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
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
      </div>
      <BusinessCard business={suggestion.business} onReport={onReport} />
    </div>
  );
}

export function ForYouSection({ onReport }: ForYouSectionProps) {
  const { t, language } = useLanguage();
  const slot = getTimeSlot();
  const morningSuggestions = useMorningRoutine();

  // Re-render when 30-min rotation window changes
  const [rotationSeed, setRotationSeed] = useState(getRotationSeed);
  useEffect(() => {
    const interval = setInterval(() => {
      const newSeed = getRotationSeed();
      setRotationSeed((prev) => (prev !== newSeed ? newSeed : prev));
    }, 30_000); // check every 30s
    return () => clearInterval(interval);
  }, []);

  // Other time slots: deterministic rotation every 30 min
  const config = slot !== 'morning' ? slotConfig[slot] : null;

  const suggested = useMemo(() => {
    if (!config) return [];
    const open = businesses.filter(
      (b) => config.categories.includes(b.category) && isBusinessOpen(b)
    );
    const rng = mulberry32(rotationSeed * 7919 + config.categories.join('').length);
    return seededShuffle(open, rng).slice(0, 3);
  }, [rotationSeed, config]);

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

  if (!config || suggested.length === 0) return null;

  const Icon = config.icon;

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