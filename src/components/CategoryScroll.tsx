import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { categories } from '@/data/mockData';
import { CategoryId } from '@/data/types';
import {
  Pill, Stethoscope, ShoppingBag, UtensilsCrossed, Coffee,
  ParkingSquare, Bus, Siren, CalendarDays, Building2, ChevronDown, Landmark,
} from 'lucide-react';
import { ComponentType } from 'react';

const iconMap: Record<string, ComponentType<{ className?: string }>> = {
  Pill, Stethoscope, ShoppingBag, UtensilsCrossed, Coffee,
  ParkingSquare, Bus, Siren, CalendarDays, Building2,
};

// Categories that are subcategories of 'doctor' and should be hidden from main scroll
const doctorSubcategories: CategoryId[] = ['dentist', 'medicine'];
const mainCategories = categories.filter(c => !doctorSubcategories.includes(c.id));

// Public services submenu items
const publicServicesSubmenu = [
  { id: 'grad-zadar', labelKey: 'publicServices.gradZadar', route: '/public-services/grad-zadar' },
  { id: 'zadarska-zupanija', labelKey: 'publicServices.zadarskaZupanija', route: '/public-services/zadarska-zupanija' },
  { id: 'komunalne-tvrtke', labelKey: 'utilities.menuLabel', route: '/utility-companies' },
];

interface CategoryScrollProps {
  onSelect: (id: CategoryId) => void;
}

export function CategoryScroll({ onSelect }: CategoryScrollProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [openSubmenu, setOpenSubmenu] = useState<'doctor' | 'publicServices' | null>(null);

  const handleCategoryClick = (id: CategoryId) => {
    if (id === 'doctor') {
      setOpenSubmenu(openSubmenu === 'doctor' ? null : 'doctor');
    } else if (id === 'publicServices') {
      setOpenSubmenu(openSubmenu === 'publicServices' ? null : 'publicServices');
    } else {
      setOpenSubmenu(null);
      onSelect(id);
    }
  };

  const hasSubmenu = (id: CategoryId) => id === 'doctor' || id === 'publicServices';

  return (
    <div className="space-y-2">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1 -mx-1 px-1">
        {mainCategories.map((cat) => {
          const Icon = iconMap[cat.icon];
          const isActive = hasSubmenu(cat.id) && openSubmenu === (cat.id === 'doctor' ? 'doctor' : cat.id === 'publicServices' ? 'publicServices' : null);
          return (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              className={`flex flex-col items-center gap-1.5 min-w-[72px] px-3 py-3 rounded-2xl bg-card border transition-all active:scale-95 ${
                isActive
                  ? 'border-accent bg-accent/10'
                  : 'border-border hover:border-accent hover:bg-accent/10'
              }`}
            >
              {Icon && <Icon className="h-5 w-5 text-accent" />}
              <span className="text-[11px] font-medium text-foreground whitespace-nowrap flex items-center gap-0.5">
                {t(cat.labelKey)}
                {hasSubmenu(cat.id) && <ChevronDown className={`h-3 w-3 transition-transform ${isActive ? 'rotate-180' : ''}`} />}
              </span>
            </button>
          );
        })}
      </div>

      {/* Doctor subcategories */}
      {openSubmenu === 'doctor' && (
        <div className="flex gap-2 pl-1 animate-in slide-in-from-top-2 duration-200">
          {doctorSubcategories.map((subId) => {
            const subCat = categories.find(c => c.id === subId);
            if (!subCat) return null;
            return (
              <button
                key={subId}
                onClick={() => { onSelect(subId); setOpenSubmenu(null); }}
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

      {/* Public Services subcategories */}
      {openSubmenu === 'publicServices' && (
        <div className="flex gap-2 pl-1 animate-in slide-in-from-top-2 duration-200">
          {publicServicesSubmenu.map((item) => (
            <button
              key={item.id}
              onClick={() => { navigate(item.route); setOpenSubmenu(null); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent/10 border border-accent/30 hover:bg-accent/20 transition-all active:scale-95"
            >
              <Landmark className="h-4 w-4 text-accent" />
              <span className="text-xs font-medium text-foreground whitespace-nowrap">
                {t(item.labelKey)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
