import { useLanguage } from '@/contexts/LanguageContext';
import { AlertTriangle, Pill, Construction, PartyPopper, Wind, Zap } from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Alert {
  id: string;
  icon: LucideIcon;
  iconColor: string;
  title: string;
  desc: string;
  link?: string;
}

function useTodayOutages() {
  return useQuery({
    queryKey: ['power-outages-today'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('power_outages')
        .select('*')
        .eq('outage_date', today);
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function TodayAlerts() {
  const { t } = useLanguage();
  const { data: outages } = useTodayOutages();
  
  const alerts: Alert[] = [];
  const hour = new Date().getHours();

  // Duty pharmacy - always shown
  alerts.push({
    id: 'duty-pharmacy',
    icon: Pill,
    iconColor: 'text-[hsl(var(--status-open))]',
    title: t('alert.dutyPharmacy'),
    desc: t('alert.dutyPharmacyDesc'),
    link: 'https://maps.app.goo.gl/MzSeHLC1RCqsJ45b6?g_st=ic',
  });

  // Power outages from DB
  if (outages && outages.length > 0) {
    if (outages.length === 1) {
      const o = outages[0];
      const timeStr = o.time_from && o.time_until ? `${o.time_from} - ${o.time_until}` : '';
      alerts.push({
        id: 'power-outage',
        icon: Zap,
        iconColor: 'text-destructive',
        title: t('alert.powerOutage'),
        desc: timeStr ? `${o.area} — ${timeStr}` : o.area,
        link: 'https://www.hep.hr/ods/bez-struje/19?dp=zadar',
      });
    } else {
      alerts.push({
        id: 'power-outage',
        icon: Zap,
        iconColor: 'text-destructive',
        title: t('alert.powerOutage'),
        desc: t('alert.powerOutageMultiple').replace('{count}', String(outages.length)),
        link: 'https://www.hep.hr/ods/bez-struje/19?dp=zadar',
      });
    }
  }

  // Road closed (daytime mock)
  if (hour >= 8 && hour <= 18) {
    alerts.push({
      id: 'road-closed',
      icon: Construction,
      iconColor: 'text-[hsl(var(--status-warning))]',
      title: t('alert.roadClosed'),
      desc: t('alert.roadClosedDesc'),
    });
  }

  // Event tonight
  if (hour >= 14) {
    alerts.push({
      id: 'event',
      icon: PartyPopper,
      iconColor: 'text-accent',
      title: t('alert.eventTonight'),
      desc: t('alert.eventTonightDesc'),
    });
  }

  // Strong wind
  if (hour >= 12) {
    alerts.push({
      id: 'wind',
      icon: Wind,
      iconColor: 'text-[hsl(var(--status-warning))]',
      title: t('alert.strongWind'),
      desc: t('alert.strongWindDesc'),
    });
  }

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
                <p className="text-xs font-semibold text-foreground truncate">{alert.title}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{alert.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
