import { useLanguage } from '@/contexts/LanguageContext';
import { BusinessCard } from '@/components/BusinessCard';
import { Business } from '@/data/types';
import { Sunrise, Sun, Sunset, Moon } from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { useMorningRoutine, MorningSuggestion } from '@/hooks/useMorningRoutine';
import { businesses, isBusinessOpen } from '@/data/mockData';
import { useMemo, useState, useEffect } from 'react';

type TimeSlot = 'morning' | 'noon' | 'evening' | 'night';

const zagrebTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Zagreb',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

function getZagrebNowParts() {
  const parts = zagrebTimeFormatter.formatToParts(new Date());
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value ?? 0);

  const year = get('year');
  const month = get('month');
  const day = get('day');
  const hour = get('hour');
  const minute = get('minute');

  const dayOfYear = Math.floor((Date.UTC(year, month - 1, day) - Date.UTC(year, 0, 0)) / 86400000);
  const halfHourSlot = Math.floor((hour * 60 + minute) / 30);

  return { hour, minute, dayOfYear, halfHourSlot };
}

function getTimeSlot(): TimeSlot {
  const { hour, minute } = getZagrebNowParts();
  const totalMin = hour * 60 + minute;
  if (totalMin >= 330 && totalMin < 630) return 'morning';
  if (hour >= 11 && hour < 16) return 'noon';
  if (hour >= 16 && hour < 21) return 'evening';
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
  const { dayOfYear, halfHourSlot } = getZagrebNowParts();
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

function getCategorySeed(categories: string[]): number {
  return categories.join('|').split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
}

const slotConfig: Record<Exclude<TimeSlot, 'morning'>, { icon: LucideIcon; titleKey: string; categories: string[] }> = {
  noon: { icon: Sun, titleKey: 'foryou.noon', categories: ['restaurants', 'cafes'] },
  evening: { icon: Sunset, titleKey: 'foryou.evening', categories: ['cafes', 'restaurants'] },
  night: { icon: Moon, titleKey: 'foryou.night', categories: ['pharmacy'] },
};

const FORBIDDEN_RESTAURANT_IDS = new Set(['rs1', 'rs2', 'rs3']);

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function hasRestaurantNameToken(name: string, token: string): boolean {
  return normalizeName(name).includes(token);
}

function isForbiddenRestaurant(business: Business): boolean {
  if (FORBIDDEN_RESTAURANT_IDS.has(business.id)) return true;
  return (
    hasRestaurantNameToken(business.name, 'kastel') ||
    hasRestaurantNameToken(business.name, 'fosa') ||
    hasRestaurantNameToken(business.name, 'kornat')
  );
}

function hasForbiddenRestaurantTrio(items: Business[]): boolean {
  const flags = new Set<string>();

  for (const item of items) {
    const name = normalizeName(item.name);
    if (name.includes('kastel')) flags.add('kastel');
    if (name.includes('fosa')) flags.add('fosa');
    if (name.includes('kornat')) flags.add('kornat');
    if (flags.size === 3) return true;
  }

  return flags.size === 3;
}

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
    if (open.length === 0) return [];

    const dayOfYear = Math.floor(rotationSeed / 100);
    const halfHourSlot = rotationSeed % 100;

    // Keep one stable daily base order, then rotate start index every 30min slot
    const dailySeed = dayOfYear * 7919 + getCategorySeed(config.categories) + 42;
    const baseOrder = seededShuffle(open, mulberry32(dailySeed));
    const start = halfHourSlot % baseOrder.length;
    const rotated = [...baseOrder.slice(start), ...baseOrder.slice(0, start)];

    const topThree = rotated.slice(0, 3);
    const containsForbiddenTrio =
      topThree.length === 3 && topThree.every((b) => FORBIDDEN_RESTAURANT_TRIO.has(b.id));

    if (!containsForbiddenTrio) return topThree;

    const replacement = rotated.find((b) => !FORBIDDEN_RESTAURANT_TRIO.has(b.id));
    if (!replacement) return topThree;

    return [topThree[0], topThree[1], replacement];
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