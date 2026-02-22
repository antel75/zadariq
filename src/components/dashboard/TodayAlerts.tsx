import { useEffect, useRef, useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AlertTriangle, Pill, Construction, PartyPopper, Wind, Zap, Droplets, Car, Trophy, Megaphone, ExternalLink, Activity } from 'lucide-react';
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
      const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('city_alerts')
        .select('*')
        .gt('valid_until', new Date().toISOString())
        .gt('created_at', cutoff)
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

function useEarthquakes() {
  return useQuery({
    queryKey: ['earthquakes-nearby'],
    queryFn: async () => {
      // EMSC FDSN API — earthquakes within ~300km of Zadar (44.12, 15.23)
      // maxradius in degrees: 300km ≈ 2.7°
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const url = `https://www.seismicportal.eu/fdsnws/event/1/query?format=json&lat=44.12&lon=15.23&maxradius=2.7&minmag=2.0&limit=5&orderby=time&start=${yesterday.toISOString()}`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = await res.json();
      return (data?.features || []) as Array<{
        id: string;
        properties: {
          time: string;
          mag: number;
          flynn_region: string;
          lat: number;
          lon: number;
          depth: number;
          unid: string;
        };
      }>;
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}

export function TodayAlerts() {
  const { t, language } = useLanguage();
  const { data: cityAlerts } = useCityAlerts();
  const { data: outages } = useTodayOutages();
  const { data: waterOutages } = useTodayWaterOutages();
  const { data: earthquakes } = useEarthquakes();

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

  // Earthquakes from EMSC
  if (earthquakes && earthquakes.length > 0) {
    for (const eq of earthquakes) {
      const mag = eq.properties.mag;
      const region = eq.properties.flynn_region;
      const depth = eq.properties.depth;
      const timeStr = eq.properties.time;
      const emscUrl = `https://www.seismicportal.eu/eventdetails.html?unid=${eq.properties.unid}`;
      
      // Priority based on magnitude
      const eqPriority = mag >= 5 ? 100 : mag >= 4 ? 95 : mag >= 3 ? 80 : 60;
      
      alerts.push({
        id: `eq-${eq.id}`,
        icon: Activity,
        iconColor: mag >= 4 ? 'text-destructive' : 'text-[hsl(var(--status-warning))]',
        title: `${language === 'hr' ? 'Potres' : 'Earthquake'} M${mag.toFixed(1)}`,
        desc: `${region}${depth ? ` — ${language === 'hr' ? 'dubina' : 'depth'} ${Math.round(depth)} km` : ''}`,
        link: emscUrl,
        updatedAt: timeStr,
        priority: eqPriority,
      });
    }
  }

  // Sort by priority desc
  alerts.sort((a, b) => b.priority - a.priority);

  // For infinite loop: duplicate alerts so we can seamlessly wrap
  const displayAlerts = alerts.length >= 2 ? [...alerts, ...alerts, ...alerts] : alerts;

  // Auto-scroll logic with seamless infinite loop
  const scrollNext = useCallback(() => {
    const el = scrollRef.current;
    if (!el || alerts.length < 2) return;
    const cardWidth = 222; // 210px card + 12px gap (gap-2.5 ≈ 10px + borders)
    const singleSetWidth = alerts.length * cardWidth;

    // If we've scrolled past the second set, jump back to the first set (no visual change)
    if (el.scrollLeft >= singleSetWidth * 2 - el.clientWidth) {
      el.scrollLeft = el.scrollLeft - singleSetWidth;
    }

    el.scrollBy({ left: cardWidth, behavior: 'smooth' });
  }, [alerts.length]);

  // Initialize scroll position to start of second set (so we can scroll back too)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || alerts.length < 2) return;
    const cardWidth = 222;
    el.scrollLeft = alerts.length * cardWidth;
  }, [alerts.length]);

  // Handle manual scroll: seamless wrap on both ends
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || alerts.length < 2) return;
    const cardWidth = 222;
    const singleSetWidth = alerts.length * cardWidth;

    if (el.scrollLeft <= cardWidth / 2) {
      el.scrollLeft += singleSetWidth;
    } else if (el.scrollLeft >= singleSetWidth * 2) {
      el.scrollLeft -= singleSetWidth;
    }
  }, [alerts.length]);

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
        className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setTimeout(() => setIsPaused(false), 3000)}
        onScroll={handleScroll}
        style={{ scrollSnapType: 'none' }}
      >
        {displayAlerts.map((alert, idx) => {
          const Icon = alert.icon;
          return (
            <div
              key={`${alert.id}-${idx}`}
              className={`flex-shrink-0 w-[260px] rounded-xl bg-card border border-border p-3 flex flex-col gap-1.5 ${alert.link ? 'cursor-pointer hover:shadow-md hover:border-primary/30 transition-all' : ''}`}
              onClick={() => alert.link && window.open(alert.link, '_blank', 'noopener,noreferrer')}
            >
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 flex-shrink-0 ${alert.iconColor}`} />
                <p className="text-xs font-semibold text-foreground truncate flex-1">{alert.title}</p>
                {alert.link && <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
              </div>
              <p className="text-[10px] text-muted-foreground line-clamp-3 leading-relaxed">{alert.desc}</p>
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
