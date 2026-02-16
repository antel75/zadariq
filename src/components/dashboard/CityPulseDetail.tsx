import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { type ZonePulse } from '@/hooks/useCityPulse';
import { UtensilsCrossed, Coffee, Footprints } from 'lucide-react';

interface Props {
  pulse: ZonePulse;
}

export function CityPulseDetail({ pulse }: Props) {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const suggestions = [
    {
      icon: UtensilsCrossed,
      label: t('category.restaurants'),
      path: '/category/restaurants',
    },
    {
      icon: Coffee,
      label: t('category.cafes'),
      path: '/category/cafes',
    },
    {
      icon: Footprints,
      label: t('pulse.walk'),
      path: `/category/restaurants`,
    },
  ];

  return (
    <div className="rounded-xl border border-border/50 bg-card/50 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-lg">{pulse.emoji}</span>
        <div>
          <p className="text-sm font-semibold text-foreground">{t(pulse.zone.nameKey)}</p>
          <p className="text-[11px] text-muted-foreground">{t(pulse.descriptionKey)}</p>
        </div>
      </div>

      <div className="flex gap-2">
        {suggestions.map(s => (
          <button
            key={s.label}
            onClick={() => navigate(s.path)}
            className="flex-1 flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-secondary/60 hover:bg-accent/10 text-xs font-medium text-foreground transition-colors"
          >
            <s.icon className="h-3 w-3 text-muted-foreground" />
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
