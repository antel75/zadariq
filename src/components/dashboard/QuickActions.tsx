import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Pill, TriangleAlert, Ship, SquareParking, Wifi } from 'lucide-react';

export function QuickActions() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const actions = [
    {
      icon: Pill,
      labelKey: 'quick.pharmacyNow',
      action: () => navigate('/category/pharmacy?open=1'),
      bg: 'bg-emerald-500/15',
      iconColor: 'text-emerald-500',
    },
    {
      icon: TriangleAlert,
      labelKey: 'quick.emergency',
      action: () => navigate('/emergency'),
      bg: 'bg-red-500/15',
      iconColor: 'text-red-500',
    },
    {
      icon: Ship,
      labelKey: 'quick.transport',
      action: () => navigate('/transport'),
      bg: 'bg-blue-500/15',
      iconColor: 'text-blue-500',
    },
    {
      icon: SquareParking,
      labelKey: 'quick.freeParking',
      action: () => navigate('/parking'),
      bg: 'bg-violet-500/15',
      iconColor: 'text-violet-500',
    },
    {
      icon: Wifi,
      labelKey: 'quick.digital',
      action: () => navigate('/digital-zadar'),
      bg: 'bg-orange-500/15',
      iconColor: 'text-orange-500',
    },
  ];

  return (
    <div>
      <h2 className="text-sm font-semibold text-foreground mb-2">{t('dashboard.quickActions')}</h2>
      <div className="grid grid-cols-5 gap-2">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.labelKey}
              onClick={a.action}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-card border border-border hover:border-accent/40 hover:shadow-sm transition-all active:scale-95"
            >
              <div className={`p-2.5 rounded-xl ${a.bg}`}>
                <Icon className={`h-5 w-5 ${a.iconColor}`} />
              </div>
              <span className="text-[10px] font-semibold text-foreground text-center leading-tight">
                {t(a.labelKey)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
