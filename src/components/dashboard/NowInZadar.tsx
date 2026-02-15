import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Pill, Stethoscope, Ship, Car, Sun, Sunset, Sunrise, CloudRain, Zap, Droplets, Thermometer, Wind, AlertTriangle } from 'lucide-react';
import { useNextFerry, formatTime, getTimeRemaining } from '@/hooks/useTransportSchedules';
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
  priority: number; // lower = higher priority
  emoji?: string;
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
    staleTime: 30 * 60 * 1000, // 30 min cache
    retry: 1,
  });
}

/** Check if sunset has already passed today */
function hasSunsetPassed(sunsetISO: string): boolean {
  if (!sunsetISO) return false;
  return new Date() > new Date(sunsetISO);
}

export function NowInZadar() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { nextFerry, isLoading: ferryLoading } = useNextFerry();
  const { data: weather } = useWeather();
  const { powerOutages, waterOutages } = useTodayOutages();
  const { data: meteoAlerts } = useMeteoAlerts();

  const parkingStatus = getParkingStatus();
  const hour = new Date().getHours();

  const cards: NowCard[] = [];

  // 1. Weather — always show, most dynamic
  if (weather) {
    const info = getWeatherInfo(weather.weatherCode, weather.isDay);
    const windLabel = getWindType(weather.windKmh);
    const windText = windLabel === 'bura' ? ' · Bura!' : windLabel === 'moderate' ? ` · ${weather.windKmh} km/h` : '';
    cards.push({
      icon: weather.weatherCode > 60 ? CloudRain : Thermometer,
      iconColor: weather.tempC > 25 ? 'text-orange-400' : weather.tempC < 5 ? 'text-blue-400' : 'text-accent',
      label: t('now.weather'),
      answer: `${info.icon} ${weather.tempC}°C${windText}`,
      action: () => {},
      priority: 1,
      emoji: info.icon,
    });
  }

  // 2. Sunset/Sunrise — smart logic
  if (weather) {
    const sunsetPassed = hasSunsetPassed(weather.sunsetISO);
    if (sunsetPassed) {
      // Show tomorrow's sunrise
      const nextSunrise = weather.sunriseNextISO
        ? weather.sunriseNextISO.split('T')[1]?.slice(0, 5) || '--:--'
        : '--:--';
      cards.push({
        icon: Sunrise,
        iconColor: 'text-amber-400',
        label: t('now.sunrise'),
        answer: `🌅 ${nextSunrise}`,
        action: () => {},
        priority: 8,
      });
    } else if (hour >= 14) {
      cards.push({
        icon: Sunset,
        iconColor: 'text-orange-400',
        label: t('now.sunset'),
        answer: `🌅 ${weather.sunset}`,
        action: () => {},
        priority: hour >= 17 ? 2 : 8,
      });
    }
  }

  // 2b. Meteo alerts — high priority
  if (meteoAlerts && meteoAlerts.length > 0) {
    const top = meteoAlerts[0];
    const levelEmoji = top.level === 'red' ? '🔴' : top.level === 'orange' ? '🟠' : '🟡';
    const typeLabel = t(`meteo.type.${top.type}`) !== `meteo.type.${top.type}` ? t(`meteo.type.${top.type}`) : t('now.meteoAlert');
    cards.push({
      icon: AlertTriangle,
      iconColor: top.level === 'red' ? 'text-destructive' : top.level === 'orange' ? 'text-orange-500' : 'text-yellow-500',
      label: t('now.meteoAlert'),
      answer: `${levelEmoji} ${typeLabel}${meteoAlerts.length > 1 ? ` +${meteoAlerts.length - 1}` : ''}`,
      action: () => window.open('https://meteoalarm.org/en/live/', '_blank'),
      priority: top.levelNum >= 3 ? 0 : 2, // red/orange = critical
    });
  }

  // 3. Power outages — critical, show if any today
  if (powerOutages.length > 0) {
    const firstArea = powerOutages[0].area;
    const timeRange = powerOutages[0].time_from && powerOutages[0].time_until
      ? `${powerOutages[0].time_from}–${powerOutages[0].time_until}`
      : '';
    cards.push({
      icon: Zap,
      iconColor: 'text-yellow-400',
      label: t('now.powerOutage'),
      answer: powerOutages.length > 1
        ? `⚡ ${powerOutages.length} ${t('now.areasAffected')}`
        : `⚡ ${firstArea}${timeRange ? ` ${timeRange}` : ''}`,
      action: () => navigate('/utility-companies'),
      priority: 0, // highest priority
    });
  }

  // 4. Water outages — critical
  if (waterOutages.length > 0) {
    const firstArea = waterOutages[0].area;
    cards.push({
      icon: Droplets,
      iconColor: 'text-blue-400',
      label: t('now.waterOutage'),
      answer: waterOutages.length > 1
        ? `💧 ${waterOutages.length} ${t('now.areasAffected')}`
        : `💧 ${firstArea}`,
      action: () => navigate('/utility-companies'),
      priority: 0,
    });
  }

  // 5. Duty pharmacy — always
  cards.push({
    icon: Pill,
    iconColor: 'text-[hsl(var(--status-open))]',
    label: t('now.pharmacy'),
    answer: 'Ljekarna Jadran — 0-24',
    action: () => window.open('https://maps.app.goo.gl/MzSeHLC1RCqsJ45b6?g_st=ic', '_blank'),
    priority: 3,
  });

  // 6. Emergency — always
  cards.push({
    icon: Stethoscope,
    iconColor: 'text-destructive',
    label: t('now.emergencyMedical'),
    answer: t('now.emergencyMedicalAnswer'),
    action: () => navigate('/emergency'),
    priority: 4,
  });

  // 7. Next ferry — always
  cards.push({
    icon: Ship,
    iconColor: 'text-accent',
    label: t('now.nextFerry'),
    answer: ferryLoading
      ? '...'
      : nextFerry
        ? `${nextFerry.destination || nextFerry.route} — ${formatTime(nextFerry.departure_time)} (${getTimeRemaining(nextFerry.departure_time)})`
        : t('now.noFerry'),
    action: () => navigate('/transport'),
    priority: 5,
  });

  // 8. Parking — always
  cards.push({
    icon: Car,
    iconColor: parkingStatus === 'free' ? 'text-[hsl(var(--status-open))]' : 'text-primary',
    label: t('now.parking'),
    answer: parkingStatus === 'free' ? t('now.parkingFree') : t('now.parkingPaid'),
    action: () => navigate('/parking'),
    priority: 6,
  });

  // Sort by priority and take top 6
  const sortedCards = cards.sort((a, b) => a.priority - b.priority).slice(0, 6);

  return (
    <div>
      <h2 className="text-sm font-bold text-foreground mb-2 uppercase tracking-wide">
        {t('now.title')}
      </h2>
      <div className="grid grid-cols-2 gap-2">
        {sortedCards.map((card, i) => {
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
