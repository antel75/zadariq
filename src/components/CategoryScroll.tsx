import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { categories } from '@/data/mockData';
import { CategoryId } from '@/data/types';
import {
  Pill, Stethoscope, ShoppingBag, UtensilsCrossed, Coffee, Fuel,
  ParkingSquare, Bus, Siren, CalendarDays, Building2, ChevronDown, Film, Anchor,
} from 'lucide-react';
import { ComponentType } from 'react';

// Custom tooth icon for dentists
const ToothIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C9.5 2 7 3.5 7 6c0 2 .5 3.5 0 6-.5 2.5-1.5 5-1 7 .5 1.5 1.5 3 3 3s2-1.5 3-4c1 2.5 1.5 4 3 4s2.5-1.5 3-3c.5-2-.5-4.5-1-7-.5-2.5 0-4 0-6 0-2.5-2.5-4-5-4z" />
  </svg>
);

// International red cross on white square — universal health symbol
const HealthCross = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="20" height="20" rx="3" fill="#FFFFFF" stroke="#DC2626" strokeWidth="1.2" />
    <path d="M10 5h4v5h5v4h-5v5h-4v-5H5v-4h5z" fill="#DC2626" />
  </svg>
);

const iconMap: Record<string, ComponentType<{ className?: string }>> = {
  Pill, Stethoscope, ShoppingBag, UtensilsCrossed, Coffee, Fuel,
  ParkingSquare, Bus, Siren, CalendarDays, Building2, Film, ToothIcon, Anchor, HealthCross,
};

// Hide subcategories — 'doctor' acts as umbrella (Medicina) with internal sub-filters for dentists
const hiddenCategories: CategoryId[] = ['medicine', 'dentist', 'pharmacy', 'emergency', 'transport', 'parking'];
const mainCategories = categories.filter(c => !hiddenCategories.includes(c.id));

// Public services submenu items
const publicServicesSubmenu = [
  { id: 'grad-zadar', labelKey: 'publicServices.gradZadar', route: '/public-services/grad-zadar' },
  { id: 'zadarska-zupanija', labelKey: 'publicServices.zadarskaZupanija', route: '/public-services/zadarska-zupanija' },
  { id: 'komunalne-tvrtke', labelKey: 'utilities.menuLabel', route: '/utility-companies' },
];

// Cinema submenu items
const cinemaSubmenu = [
  { id: 'cinestar', label: 'CineStar', route: '/cinema' },
  { id: 'kino-zona', label: 'Kino Zona', route: '/kino-zona' },
];

interface CategoryScrollProps {
  onSelect: (id: CategoryId) => void;
}

export function CategoryScroll({ onSelect }: CategoryScrollProps) {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [openSubmenu, setOpenSubmenu] = useState<'publicServices' | 'cinema' | null>(null);

  // Categories that route to dedicated pages instead of CategoryBrowse
  const directRoutes: Record<string, string> = {
    publicServices: '/public-services',
    transport: '/transport',
    parking: '/parking',
    emergency: '/emergency',
  };

  const handleCategoryClick = (id: CategoryId | string) => {
    if (directRoutes[id]) {
      navigate(directRoutes[id]);
    } else if (id === 'cinema') {
      setOpenSubmenu(openSubmenu === 'cinema' ? null : 'cinema');
    } else {
      setOpenSubmenu(null);
      onSelect(id as CategoryId);
    }
  };

  const hasSubmenu = (id: string) => id === 'publicServices' || id === 'cinema';

  return (
    <div className="space-y-2">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1 -mx-1 px-1">
        {mainCategories.map((cat) => {
          const Icon = iconMap[cat.icon];
          return (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              className="flex flex-col items-center gap-1.5 min-w-[72px] max-w-[80px] px-2 py-3 rounded-2xl bg-card border border-border hover:border-accent hover:bg-accent/10 transition-all active:scale-95"
            >
              {Icon && <Icon className="h-5 w-5 text-accent shrink-0" />}
              <span className="text-[10px] leading-tight font-medium text-foreground text-center line-clamp-2 flex items-center gap-0.5">
                {t(cat.labelKey)}
                {hasSubmenu(cat.id) && <ChevronDown className="h-3 w-3 shrink-0" />}
              </span>
            </button>
          );
        })}
        {/* Kino button */}
        <button
          onClick={() => handleCategoryClick('cinema')}
          className={`flex flex-col items-center gap-1.5 min-w-[72px] max-w-[80px] px-2 py-3 rounded-2xl bg-card border transition-all active:scale-95 ${
            openSubmenu === 'cinema'
              ? 'border-accent bg-accent/10'
              : 'border-border hover:border-accent hover:bg-accent/10'
          }`}
        >
          <Film className="h-5 w-5 text-accent shrink-0" />
          <span className="text-[10px] leading-tight font-medium text-foreground text-center flex items-center gap-0.5">
            {language === 'hr' ? 'Kino' : 'Cinema'}
            <ChevronDown className={`h-3 w-3 shrink-0 transition-transform ${openSubmenu === 'cinema' ? 'rotate-180' : ''}`} />
          </span>
        </button>
      </div>

      {/* Cinema submenu */}
      {openSubmenu === 'cinema' && (
        <div className="flex gap-2 pl-1 animate-in slide-in-from-top-2 duration-200">
          {cinemaSubmenu.map((item) => (
            <button
              key={item.id}
              onClick={() => { navigate(item.route); setOpenSubmenu(null); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent/10 border border-accent/30 hover:bg-accent/20 transition-all active:scale-95"
            >
              <Film className="h-4 w-4 text-accent" />
              <span className="text-xs font-medium text-foreground whitespace-nowrap">{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
