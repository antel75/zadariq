import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { UtensilsCrossed, Landmark, Waves, Car, Ship, Pill, Map } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface TouristAction {
  icon: LucideIcon;
  labelKey: string;
  action: () => void;
  color: string;
}

export function TouristQuickActions() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const actions: TouristAction[] = [
    {
      icon: Waves,
      labelKey: 'tourist.beaches',
      action: () => navigate('/search?q=beach'),
      color: 'bg-primary/10 text-primary',
    },
    {
      icon: Landmark,
      labelKey: 'tourist.sights',
      action: () => navigate('/znamenitosti'),
      color: 'bg-accent/10 text-accent',
    },
    {
      icon: UtensilsCrossed,
      labelKey: 'tourist.restaurants',
      action: () => navigate('/category/restaurants'),
      color: 'bg-[hsl(var(--status-open))]/10 text-[hsl(var(--status-open))]',
    },
    {
      icon: Car,
      labelKey: 'quick.freeParking',
      action: () => navigate('/parking'),
      color: 'bg-secondary text-secondary-foreground',
    },
    {
      icon: Ship,
      labelKey: 'quick.transport',
      action: () => navigate('/transport'),
      color: 'bg-primary/10 text-primary',
    },
    {
      icon: Map,
      labelKey: 'tourist.quest',
      action: () => navigate('/quest'),
      color: 'bg-accent/10 text-accent',
    },
    {
      icon: Pill,
      labelKey: 'quick.pharmacyNow',
      action: () => navigate('/category/pharmacy?open=1'),
      color: 'bg-destructive/10 text-destructive',
    },
  ];

  return (
    <div>
      <h2 className="text-sm font-semibold text-foreground mb-2">{t('tourist.explore')}</h2>
      <div className="grid grid-cols-3 gap-2">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.labelKey}
              onClick={a.action}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-card border border-border hover:border-accent/40 transition-colors"
            >
              <div className={`p-2 rounded-lg ${a.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-medium text-foreground text-center leading-tight">
                {t(a.labelKey)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
