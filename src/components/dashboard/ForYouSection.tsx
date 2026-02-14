import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { businesses, isBusinessOpen } from '@/data/mockData';
import { BusinessCard } from '@/components/BusinessCard';
import { Business } from '@/data/types';
import { Sunrise, Sun, Sunset, Moon } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

type TimeSlot = 'morning' | 'noon' | 'evening' | 'night';

function getTimeSlot(): TimeSlot {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return 'morning';
  if (h >= 11 && h < 16) return 'noon';
  if (h >= 16 && h < 21) return 'evening';
  return 'night';
}

const slotConfig: Record<TimeSlot, { icon: LucideIcon; titleKey: string; categories: string[] }> = {
  morning: { icon: Sunrise, titleKey: 'foryou.morning', categories: ['pharmacy', 'shops'] },
  noon: { icon: Sun, titleKey: 'foryou.noon', categories: ['restaurants', 'cafes'] },
  evening: { icon: Sunset, titleKey: 'foryou.evening', categories: ['cafes', 'restaurants'] },
  night: { icon: Moon, titleKey: 'foryou.night', categories: ['pharmacy'] },
};

interface ForYouSectionProps {
  onReport: (b: Business) => void;
}

export function ForYouSection({ onReport }: ForYouSectionProps) {
  const { t } = useLanguage();
  const slot = getTimeSlot();
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
