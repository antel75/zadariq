import { useLanguage } from '@/contexts/LanguageContext';
import { categories } from '@/data/mockData';
import { CategoryId } from '@/data/types';
import {
  Pill, Stethoscope, ShoppingBag, UtensilsCrossed, Coffee,
  ParkingSquare, Bus, Siren, CalendarDays, Building2,
} from 'lucide-react';
import { ComponentType } from 'react';

const iconMap: Record<string, ComponentType<{ className?: string }>> = {
  Pill, Stethoscope, ShoppingBag, UtensilsCrossed, Coffee,
  ParkingSquare, Bus, Siren, CalendarDays, Building2,
};

interface CategoryScrollProps {
  onSelect: (id: CategoryId) => void;
}

export function CategoryScroll({ onSelect }: CategoryScrollProps) {
  const { t } = useLanguage();

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1 -mx-1 px-1">
      {categories.map((cat) => {
        const Icon = iconMap[cat.icon];
        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className="flex flex-col items-center gap-1.5 min-w-[72px] px-3 py-3 rounded-2xl bg-card border border-border hover:border-accent hover:bg-accent/10 transition-all active:scale-95"
          >
            {Icon && <Icon className="h-5 w-5 text-accent" />}
            <span className="text-[11px] font-medium text-foreground whitespace-nowrap">
              {t(cat.labelKey)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
