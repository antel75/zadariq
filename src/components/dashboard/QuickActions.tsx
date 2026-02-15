import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Pill, Car, Siren, Ship } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface QuickAction {
  icon: LucideIcon;
  labelKey: string;
  action: () => void;
  color: string;
}

export function QuickActions() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const actions: QuickAction[] = [
    {
      icon: Pill,
      labelKey: 'quick.pharmacyNow',
      action: () => navigate('/category/pharmacy?open=1'),
      color: 'bg-[hsl(var(--status-open))]/10 text-[hsl(var(--status-open))]',
    },
    {
      icon: Siren,
      labelKey: 'quick.emergency',
      action: () => navigate('/emergency'),
      color: 'bg-destructive/10 text-destructive',
    },
    {
      icon: Ship,
      labelKey: 'quick.transport',
      action: () => navigate('/transport'),
      color: 'bg-primary/10 text-primary',
    },
    {
      icon: Car,
      labelKey: 'quick.freeParking',
      action: () => navigate('/parking'),
      color: 'bg-accent/10 text-accent',
    },
  ];

  return (
    <div>
      <h2 className="text-sm font-semibold text-foreground mb-2">{t('dashboard.quickActions')}</h2>
      <div className="grid grid-cols-4 gap-2">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.labelKey}
              onClick={a.action}
              className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-card border border-border hover:border-accent/40 transition-colors"
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
