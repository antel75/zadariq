import { useEffect, useRef, useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AlertTriangle, Pill, Construction, PartyPopper, Wind, Zap, Droplets, Car, Trophy, Megaphone, ExternalLink } from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { hr } from 'date-fns/locale';

interface AlertCard {
  id: string;
  icon: LucideIcon;
  iconColor: string;
  title: string;
  desc: string;
  link?: string;
  updatedAt?: string;
  priority: number;
}

const typeIconMap: Record<string, { icon: LucideIcon; color: string }> = {
  traffic: { icon: Car, color: 'text-[hsl(var(--status-warning))]' },
  roads: { icon: Construction, color: 'text-[hsl(var(--status-warning))]' },
  sport: { icon: Trophy, color: 'text-accent' },
  power: { icon: Zap, color: 'text-destructive' },
  water: { icon: Droplets, color: 'text-blue-500' },
  weather: { icon: Wind, color: 'text-[hsl(var(--status-warning))]' },
  event: { icon: PartyPopper, color: 'text-accent' },
  general: { icon: Megaphone, color: 'text-primary' },
};

function useCityAlerts() {
  return useQuery({
    queryKey: ['city-alerts-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('city_alerts')
        .select('*')
        .gt('valid_until', new Date().toISOString())
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
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

function useTodayWaterOutages() {
  return useQuery({
    queryKey: ['water-outages-today'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('water_outages')
        .select('*')
        .eq('outage_date', today);
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function TodayAlerts() {
  const { t, language } = useLanguage();
  const { data: cityAlerts } = useCityAlerts();
  const { data: outages } = useTodayOutages();
  const { data: waterOutages } = useTodayWaterOutages();

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const alerts: AlertCard[] = [];

  // Add city_alerts from DB
  if (cityAlerts) {
    for (const ca of cityAlerts) {
      const typeInfo = typeIconMap[ca.type] || typeIconMap.general;
      alerts.push({
        id: `ca-${ca.id}`,
        icon: typeInfo.icon,
        iconColor: typeInfo.color,
        title: ca.title,
        desc: ca.summary,
        link: ca.source_url || undefined,
        updatedAt: ca.created_at,
        priority: ca.priority,
      });
    }
  }

  // Duty pharmacy - always
  alerts.push({
    id: 'duty-pharmacy',
    icon: Pill,
    iconColor: 'text-[hsl(var(--status-open))]',
    title: t('alert.dutyPharmacy'),
    desc: t('alert.dutyPharmacyDesc'),
    link: 'https://maps.app.goo.gl/MzSeHLC1RCqsJ45b6?g_st=ic',
    priority: 50,
  });

  // Power outages
  if (outages && outages.length > 0) {
    const desc = outages.length === 1
      ? (outages[0].time_from && outages[0].time_until ? `${outages[0].area} — ${outages[0].time_from} - ${outages[0].time_until}` : outages[0].area)
      : t('alert.powerOutageMultiple').replace('{count}', String(outages.length));
    alerts.push({
      id: 'power-outage',
      icon: Zap,
      iconColor: 'text-destructive',
      title: t('alert.powerOutage'),
      desc,
      link: 'https://www.hep.hr/ods/bez-struje/19?dp=zadar',
      priority: 90,
    });
  }

  // Water outages
  if (waterOutages && waterOutages.length > 0) {
    const desc = waterOutages.length === 1
      ? (waterOutages[0].time_from && waterOutages[0].time_until ? `${waterOutages[0].area} — ${waterOutages[0].time_from} - ${waterOutages[0].time_until}` : waterOutages[0].area)
      : t('alert.waterOutageMultiple').replace('{count}', String(waterOutages.length));
    alerts.push({
      id: 'water-outage',
      icon: Droplets,
      iconColor: 'text-blue-500',
      title: t('alert.waterOutage'),
      desc,
      link: 'https://www.vodovod-zadar.hr/obavijesti',
      priority: 85,
    });
  }

  // Sort by priority desc
  alerts.sort((a, b) => b.priority - a.priority);

  // Auto-scroll logic
  const scrollNext = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = 220; // w-[210px] + gap
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (el.scrollLeft >= maxScroll - 10) {
      el.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      el.scrollBy({ left: cardWidth, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    if (alerts.length <= 1) return;
    if (!isPaused) {
      intervalRef.current = setInterval(scrollNext, 6000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused, scrollNext, alerts.length]);

  if (alerts.length === 0) return null;

  const locale = language === 'hr' ? hr : undefined;

  return (
    <div>
      <h2 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-[hsl(var(--status-warning))]" />
        {t('dashboard.alerts')}
      </h2>
      <div
        ref={scrollRef}
        className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1 snap-x snap-mandatory"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setTimeout(() => setIsPaused(false), 3000)}
      >
        {alerts.map((alert) => {
          const Icon = alert.icon;
          return (
            <div
              key={alert.id}
              className={`flex-shrink-0 w-[210px] snap-start rounded-xl bg-card border border-border p-3 flex flex-col gap-1.5 ${alert.link ? 'cursor-pointer hover:shadow-md hover:border-primary/30 transition-all' : ''}`}
              onClick={() => alert.link && window.open(alert.link, '_blank', 'noopener,noreferrer')}
            >
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 flex-shrink-0 ${alert.iconColor}`} />
                <p className="text-xs font-semibold text-foreground truncate flex-1">{alert.title}</p>
                {alert.link && <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
              </div>
              <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">{alert.desc}</p>
              {alert.updatedAt && (
                <p className="text-[9px] text-muted-foreground/60 mt-auto">
                  {formatDistanceToNow(new Date(alert.updatedAt), { addSuffix: true, locale })}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
