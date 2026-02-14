import { useLanguage } from '@/contexts/LanguageContext';
import { AlertTriangle, Pill, Construction, PartyPopper, Wind, Droplets } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface Alert {
  id: string;
  icon: LucideIcon;
  iconColor: string;
  titleKey: string;
  descKey: string;
  link?: string;
}

function getMockAlerts(): Alert[] {
  const hour = new Date().getHours();
  const alerts: Alert[] = [
    {
      id: 'duty-pharmacy',
      icon: Pill,
      iconColor: 'text-[hsl(var(--status-open))]',
      titleKey: 'alert.dutyPharmacy',
      descKey: 'alert.dutyPharmacyDesc',
      link: 'https://maps.app.goo.gl/MzSeHLC1RCqsJ45b6?g_st=ic',
    },
  ];

  if (hour >= 8 && hour <= 18) {
    alerts.push({
      id: 'road-closed',
      icon: Construction,
      iconColor: 'text-[hsl(var(--status-warning))]',
      titleKey: 'alert.roadClosed',
      descKey: 'alert.roadClosedDesc',
    });
  }

  if (hour >= 14) {
    alerts.push({
      id: 'event',
      icon: PartyPopper,
      iconColor: 'text-accent',
      titleKey: 'alert.eventTonight',
      descKey: 'alert.eventTonightDesc',
    });
  }

  if (hour >= 12) {
    alerts.push({
      id: 'wind',
      icon: Wind,
      iconColor: 'text-[hsl(var(--status-warning))]',
      titleKey: 'alert.strongWind',
      descKey: 'alert.strongWindDesc',
    });
  }

  return alerts;
}

export function TodayAlerts() {
  const { t } = useLanguage();
  const alerts = getMockAlerts();

  if (alerts.length === 0) return null;

  return (
    <div>
      <h2 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-[hsl(var(--status-warning))]" />
        {t('dashboard.alerts')}
      </h2>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {alerts.map((alert) => {
          const Icon = alert.icon;
          return (
            <div
              key={alert.id}
              className={`flex-shrink-0 w-52 rounded-xl bg-card border border-border p-3 flex items-start gap-2.5 ${alert.link ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
              onClick={() => alert.link && window.open(alert.link, '_blank', 'noopener,noreferrer')}
            >
              <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${alert.iconColor}`} />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{t(alert.titleKey)}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{t(alert.descKey)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
