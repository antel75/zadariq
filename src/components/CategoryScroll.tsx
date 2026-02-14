import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { categories } from '@/data/mockData';
import { CategoryId } from '@/data/types';
import {
  Pill, Stethoscope, ShoppingBag, UtensilsCrossed, Coffee,
  ParkingSquare, Bus, Siren, CalendarDays, Building2, ChevronDown,
} from 'lucide-react';
import { ComponentType } from 'react';

const iconMap: Record<string, ComponentType<{ className?: string }>> = {
  Pill, Stethoscope, ShoppingBag, UtensilsCrossed, Coffee,
  ParkingSquare, Bus, Siren, CalendarDays, Building2,
};

// Categories that are subcategories of 'doctor' and should be hidden from main scroll
const doctorSubcategories: CategoryId[] = ['dentist', 'medicine'];
const mainCategories = categories.filter(c => !doctorSubcategories.includes(c.id));

interface CategoryScrollProps {
  onSelect: (id: CategoryId) => void;
}

export function CategoryScroll({ onSelect }: CategoryScrollProps) {
  const { t } = useLanguage();
  const [showDoctorSub, setShowDoctorSub] = useState(false);

  const handleCategoryClick = (id: CategoryId) => {
    if (id === 'doctor') {
      setShowDoctorSub(!showDoctorSub);
    } else {
      setShowDoctorSub(false);
      onSelect(id);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1 -mx-1 px-1">
        {mainCategories.map((cat) => {
          const Icon = iconMap[cat.icon];
          const isDoctor = cat.id === 'doctor';
          return (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              className={`flex flex-col items-center gap-1.5 min-w-[72px] px-3 py-3 rounded-2xl bg-card border transition-all active:scale-95 ${
                isDoctor && showDoctorSub
                  ? 'border-accent bg-accent/10'
                  : 'border-border hover:border-accent hover:bg-accent/10'
              }`}
            >
              {Icon && <Icon className="h-5 w-5 text-accent" />}
              <span className="text-[11px] font-medium text-foreground whitespace-nowrap flex items-center gap-0.5">
                {t(cat.labelKey)}
                {isDoctor && <ChevronDown className={`h-3 w-3 transition-transform ${showDoctorSub ? 'rotate-180' : ''}`} />}
              </span>
            </button>
          );
        })}
      </div>

      {/* Doctor subcategories */}
      {showDoctorSub && (
        <div className="flex gap-2 pl-1 animate-in slide-in-from-top-2 duration-200">
          {doctorSubcategories.map((subId) => {
            const subCat = categories.find(c => c.id === subId);
            if (!subCat) return null;
            return (
              <button
                key={subId}
                onClick={() => { onSelect(subId); setShowDoctorSub(false); }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent/10 border border-accent/30 hover:bg-accent/20 transition-all active:scale-95"
              >
                <Stethoscope className="h-4 w-4 text-accent" />
                <span className="text-xs font-medium text-foreground whitespace-nowrap">
                  {t(subCat.labelKey)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
