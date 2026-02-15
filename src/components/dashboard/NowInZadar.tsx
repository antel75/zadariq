import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Pill, Stethoscope, Ship, Car, CloudRain, Zap, Droplets, AlertTriangle, Sunset, Sunrise, Coffee, Phone, MapPin, Fuel } from 'lucide-react';
import { useSmartFerry, formatTime, getTimeRemaining } from '@/hooks/useTransportSchedules';
import { getParkingStatus } from '@/data/parkingData';
import { useWeather, getWeatherInfo, getWindType } from '@/hooks/useWeather';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface NowCard {
  icon: React.ElementType;
  iconColor: string;
  label: string;
  answer: string;
  action: () => void;
  priority: number; // 0-100, higher = more important
  isActionable: boolean; // true = solves a problem; false = informational
}

// ── Helpers ──

function getWeatherAdvice(
  weatherCode: number,
  tempC: number,
  windKmh: number,
  t: (key: string) => string
): string {
  const windType = getWindType(windKmh);
  if (weatherCode >= 80) return t('advice.stormStayIn');
  if (weatherCode >= 51) return t('advice.rainUmbrella');
  if (weatherCode >= 40 && weatherCode <= 48) return t('advice.fogCareful');
  if (windType === 'bura') return t('advice.buraWind');
  if (tempC >= 32) return t('advice.hotSunscreen');
  if (tempC <= 5) return t('advice.coldJacket');
  if (tempC >= 18 && weatherCode <= 3) return t('advice.niceDay');
  return t('advice.warmNoJacket');
}

function useTodayOutages() {
  const today = new Date().toISOString().split('T')[0];
  const power = useQuery({
    queryKey: ['power-outages-today', today],
    queryFn: async () => {
      const { data } = await supabase
        .from('power_outages')
        .select('area, time_from, time_until')
        .eq('outage_date', today);
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
  });
  const water = useQuery({
    queryKey: ['water-outages-today', today],
    queryFn: async () => {
      const { data } = await supabase
        .from('water_outages')
        .select('area, time_from, time_until')
        .eq('outage_date', today);
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
  });
  return { powerOutages: power.data || [], waterOutages: water.data || [] };
}

function useMeteoAlerts() {
  return useQuery({
    queryKey: ['meteoalarm-zadar'],
    queryFn: async () => {
      const res = await supabase.functions.invoke('meteoalarm');
      if (res.error) throw res.error;
      return (res.data?.alerts || []) as Array<{
        title: string;
        level: string;
        levelNum: number;
        type: string;
        description: string;
      }>;
    },
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });
}

// ── Priority Algorithm ──
// All candidate cards get a priority score (0-100).
// Night rule (00-06): discard anything below 70.
// Sort descending, take exactly 4.
// If actionable cards exist, they replace informational ones.

function selectTopCards(candidates: NowCard[], hour: number): NowCard[] {
  const isNight = hour >= 0 && hour < 6;

  let pool = candidates;

  // Night rule: ignore low-priority cards
  if (isNight) {
    pool = pool.filter(c => c.priority >= 70);
  }

  // Sort: priority desc, then actionable first
  pool.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return (b.isActionable ? 1 : 0) - (a.isActionable ? 1 : 0);
  });

  // If we have more than 4, prefer actionable over informational
  if (pool.length > 4) {
    const actionable = pool.filter(c => c.isActionable);
    const informational = pool.filter(c => !c.isActionable);
    // Fill with actionable first, then informational
    pool = [...actionable, ...informational].slice(0, 4);
    // Re-sort by priority for display order
    pool.sort((a, b) => b.priority - a.priority);
  }

  return pool.slice(0, 4);
}

export function NowInZadar() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { ferry, firstFerry, isToday, isLoading: ferryLoading } = useSmartFerry();
  const { data: weather } = useWeather();
  const { powerOutages, waterOutages } = useTodayOutages();
  const { data: meteoAlerts } = useMeteoAlerts();
  const parkingStatus = getParkingStatus();
  const hour = new Date().getHours();

  const candidates: NowCard[] = [];

  // ── PRIORITY 100+: Critical alerts (safety) ──

  if (meteoAlerts && meteoAlerts.length > 0) {
    const top = meteoAlerts[0];
    const levelEmoji = top.level === 'red' ? '🔴' : top.level === 'orange' ? '🟠' : '🟡';
    const typeLabel = t(`meteo.type.${top.type}`) !== `meteo.type.${top.type}` ? t(`meteo.type.${top.type}`) : t('now.meteoAlert');
    candidates.push({
      icon: AlertTriangle,
      iconColor: top.level === 'red' ? 'text-destructive' : top.level === 'orange' ? 'text-orange-500' : 'text-yellow-500',
      label: t('now.meteoAlert'),
      answer: `${levelEmoji} ${typeLabel}${meteoAlerts.length > 1 ? ` +${meteoAlerts.length - 1}` : ''}`,
      action: () => window.open('https://meteoalarm.org/en/live/', '_blank'),
      priority: 110,
      isActionable: true,
    });
  }

  if (powerOutages.length > 0) {
    const firstArea = powerOutages[0].area;
    const timeRange = powerOutages[0].time_from && powerOutages[0].time_until
      ? `${powerOutages[0].time_from}–${powerOutages[0].time_until}` : '';
    candidates.push({
      icon: Zap,
      iconColor: 'text-yellow-400',
      label: t('now.powerOutage'),
      answer: powerOutages.length > 1
        ? `⚡ ${powerOutages.length} ${t('now.areasAffected')}`
        : `⚡ ${firstArea}${timeRange ? ` ${timeRange}` : ''}`,
      action: () => navigate('/utility-companies'),
      priority: 105,
      isActionable: true,
    });
  }

  if (waterOutages.length > 0) {
    candidates.push({
      icon: Droplets,
      iconColor: 'text-blue-400',
      label: t('now.waterOutage'),
      answer: waterOutages.length > 1
        ? `💧 ${waterOutages.length} ${t('now.areasAffected')}`
        : `💧 ${waterOutages[0].area}`,
      action: () => navigate('/utility-companies'),
      priority: 105,
      isActionable: true,
    });
  }

  // ── PRIORITY 100: Health / Safety / 24h ──

  // Duty pharmacy (always relevant — 0-24)
  candidates.push({
    icon: Pill,
    iconColor: 'text-[hsl(var(--status-open))]',
    label: t('now.pharmacy'),
    answer: 'Ljekarna Jadran — 0-24',
    action: () => window.open('https://maps.app.goo.gl/MzSeHLC1RCqsJ45b6?g_st=ic', '_blank'),
    priority: 100,
    isActionable: true,
  });

  // Emergency medical (boost at night)
  candidates.push({
    icon: Stethoscope,
    iconColor: 'text-destructive',
    label: t('now.emergencyMedical'),
    answer: t('now.emergencyMedicalAnswer'),
    action: () => navigate('/emergency'),
    priority: hour >= 0 && hour < 6 ? 100 : 50, // high at night, low otherwise
    isActionable: true,
  });

  // Open 24/7 (gas station) — boosted at night/evening
  candidates.push({
    icon: Fuel,
    iconColor: 'text-accent',
    label: t('now.open247'),
    answer: t('now.gasStation'),
    action: () => window.open('https://maps.app.goo.gl/EBvz4DCnxbKLmFwJ8?g_st=ic', '_blank'),
    priority: (hour >= 20 || hour < 6) ? 100 : 60,
    isActionable: true,
  });

  // ── PRIORITY 90: Movement / getting home ──

  // Taxi (boosted at night/evening)
  candidates.push({
    icon: Phone,
    iconColor: 'text-accent',
    label: t('now.taxi'),
    answer: t('now.taxiAvailable'),
    action: () => window.open('tel:023251400'),
    priority: (hour >= 20 || hour < 6) ? 90 : 45,
    isActionable: true,
  });

  // Ferry/catamaran — smart: next today OR first tomorrow
  if (!ferryLoading) {
    if (isToday && ferry) {
      const isLast = hour >= 18; // rough heuristic
      candidates.push({
        icon: Ship,
        iconColor: isLast ? 'text-orange-400' : 'text-accent',
        label: isLast ? t('now.lastFerry') : t('now.nextFerry'),
        answer: `${ferry.destination || ferry.route} — ${formatTime(ferry.departure_time)} (${getTimeRemaining(ferry.departure_time)})`,
        action: () => navigate('/transport'),
        priority: 90,
        isActionable: true,
      });
    } else if (firstFerry) {
      // No more ferries today → show first tomorrow
      candidates.push({
        icon: Ship,
        iconColor: 'text-accent',
        label: t('now.firstFerry'),
        answer: `${firstFerry.destination || firstFerry.route} — ${formatTime(firstFerry.departure_time)}`,
        action: () => navigate('/transport'),
        priority: (hour >= 0 && hour < 6) ? 90 : 70,
        isActionable: true,
      });
    }
  }

  // ── PRIORITY 70: City navigation ──

  // Parking
  candidates.push({
    icon: Car,
    iconColor: parkingStatus === 'free' ? 'text-[hsl(var(--status-open))]' : 'text-primary',
    label: t('now.parking'),
    answer: parkingStatus === 'free' ? t('now.parkingFree') : t('now.parkingPaid'),
    action: () => navigate('/parking'),
    priority: (hour >= 7 && hour < 20) ? 70 : 35,
    isActionable: true,
  });

  // Old town crowd
  const crowdLevel = hour < 9 || hour >= 22 ? t('now.oldTownQuiet') : t('now.oldTownBusy');
  candidates.push({
    icon: MapPin,
    iconColor: 'text-[hsl(var(--status-open))]',
    label: t('now.oldTown'),
    answer: crowdLevel,
    action: () => {},
    priority: (hour >= 8 && hour < 20) ? 70 : 30,
    isActionable: false,
  });

  // ── PRIORITY 40: Informational ──

  // Weather advice
  if (weather) {
    candidates.push({
      icon: weather.weatherCode > 60 ? CloudRain : (hour < 12 ? Sunrise : Sunset),
      iconColor: 'text-accent',
      label: t('now.weatherAdvice'),
      answer: getWeatherAdvice(weather.weatherCode, weather.tempC, weather.windKmh, t),
      action: () => {},
      priority: 40,
      isActionable: false,
    });
  }

  // Sunset (afternoon only)
  if (weather && hour >= 14 && hour < 21) {
    candidates.push({
      icon: Sunset,
      iconColor: 'text-orange-400',
      label: t('now.sunset'),
      answer: `🌅 ${weather.sunset}`,
      action: () => {},
      priority: 40,
      isActionable: false,
    });
  }

  // Sunrise (night/early morning)
  if (weather && (hour >= 0 && hour < 7)) {
    candidates.push({
      icon: Sunrise,
      iconColor: 'text-amber-400',
      label: t('now.morningAdvice'),
      answer: getWeatherAdvice(weather.weatherCode, weather.tempC, weather.windKmh, t),
      action: () => {},
      priority: 40,
      isActionable: false,
    });
  }

  // ── Select top 4 ──
  const topCards = selectTopCards(candidates, hour);

  return (
    <div>
      <h2 className="text-sm font-bold text-foreground mb-2 uppercase tracking-wide">
        {t('now.title')}
      </h2>
      <div className="grid grid-cols-2 gap-2">
        {topCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <button
              key={i}
              onClick={card.action}
              className="flex items-start gap-2.5 p-3 rounded-xl bg-card border border-border hover:border-accent/40 transition-colors text-left"
            >
              <div className="p-1.5 rounded-lg bg-muted/50 shrink-0">
                <Icon className={`h-4 w-4 ${card.iconColor}`} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{card.label}</p>
                <p className="text-xs font-semibold text-foreground mt-0.5 leading-tight">{card.answer}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
