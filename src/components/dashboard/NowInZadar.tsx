import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Pill, Stethoscope, Ship, Car, CloudRain, Zap, Droplets, AlertTriangle, Sunset, Sunrise, Coffee, Phone, MapPin, Fuel } from 'lucide-react';
import { useSmartFerry, formatTime, getTimeRemaining } from '@/hooks/useTransportSchedules';
import { getParkingStatus } from '@/data/parkingData';
import { useWeather, getWeatherInfo, getWindType } from '@/hooks/useWeather';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type TimeSlot = 'morning' | 'day' | 'evening' | 'night';

interface NowCard {
  icon: React.ElementType;
  iconColor: string;
  label: string;
  answer: string;
  action: () => void;
  priority: number;
}

function getTimeSlot(): TimeSlot {
  const h = new Date().getHours();
  if (h >= 6 && h < 12) return 'morning';
  if (h >= 12 && h < 20) return 'day';
  if (h >= 20) return 'evening';
  return 'night';
}

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
  if (tempC <= 15) return t('advice.warmNoJacket').replace('bez jakne 😎', '').trim() ? t('advice.coldJacket') : t('advice.coldJacket');
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

export function NowInZadar() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { ferry, firstFerry, isToday, isLoading: ferryLoading } = useSmartFerry();
  const { data: weather } = useWeather();
  const { powerOutages, waterOutages } = useTodayOutages();
  const { data: meteoAlerts } = useMeteoAlerts();
  const parkingStatus = getParkingStatus();
  const slot = getTimeSlot();
  const hour = new Date().getHours();

  const cards: NowCard[] = [];

  // ── CRITICAL ALERTS (always shown, any time slot) ──

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
      priority: 0,
    });
  }

  if (powerOutages.length > 0) {
    const firstArea = powerOutages[0].area;
    const timeRange = powerOutages[0].time_from && powerOutages[0].time_until
      ? `${powerOutages[0].time_from}–${powerOutages[0].time_until}` : '';
    cards.push({
      icon: Zap,
      iconColor: 'text-yellow-400',
      label: t('now.powerOutage'),
      answer: powerOutages.length > 1
        ? `⚡ ${powerOutages.length} ${t('now.areasAffected')}`
        : `⚡ ${firstArea}${timeRange ? ` ${timeRange}` : ''}`,
      action: () => navigate('/utility-companies'),
      priority: 0,
    });
  }

  if (waterOutages.length > 0) {
    cards.push({
      icon: Droplets,
      iconColor: 'text-blue-400',
      label: t('now.waterOutage'),
      answer: waterOutages.length > 1
        ? `💧 ${waterOutages.length} ${t('now.areasAffected')}`
        : `💧 ${waterOutages[0].area}`,
      action: () => navigate('/utility-companies'),
      priority: 0,
    });
  }

  // ── TIME-SLOT SPECIFIC CARDS ──

  if (slot === 'morning') {
    // Weather advice (not temperature!)
    if (weather) {
      cards.push({
        icon: weather.weatherCode > 60 ? CloudRain : Sunrise,
        iconColor: 'text-accent',
        label: t('now.weatherAdvice'),
        answer: getWeatherAdvice(weather.weatherCode, weather.tempC, weather.windKmh, t),
        action: () => {},
        priority: 1,
      });
    }

    // Next ferry
    if (!ferryLoading) {
      if (isToday && ferry) {
        cards.push({
          icon: Ship,
          iconColor: 'text-accent',
          label: t('now.nextFerry'),
          answer: `${ferry.destination || ferry.route} — ${formatTime(ferry.departure_time)} (${getTimeRemaining(ferry.departure_time)})`,
          action: () => navigate('/transport'),
          priority: 2,
        });
      }
    }

    // Old town crowd (morning = quiet)
    cards.push({
      icon: MapPin,
      iconColor: 'text-[hsl(var(--status-open))]',
      label: t('now.oldTown'),
      answer: hour < 9 ? t('now.oldTownQuiet') : t('now.oldTownBusy'),
      action: () => {},
      priority: 3,
    });

    // Parking
    cards.push({
      icon: Car,
      iconColor: parkingStatus === 'free' ? 'text-[hsl(var(--status-open))]' : 'text-primary',
      label: t('now.parking'),
      answer: parkingStatus === 'free' ? t('now.parkingFree') : t('now.parkingPaid'),
      action: () => navigate('/parking'),
      priority: 4,
    });
  }

  if (slot === 'day') {
    // Duty pharmacy
    cards.push({
      icon: Pill,
      iconColor: 'text-[hsl(var(--status-open))]',
      label: t('now.pharmacy'),
      answer: 'Ljekarna Jadran — 0-24',
      action: () => window.open('https://maps.app.goo.gl/MzSeHLC1RCqsJ45b6?g_st=ic', '_blank'),
      priority: 1,
    });

    // Next ferry/catamaran
    if (!ferryLoading && isToday && ferry) {
      cards.push({
        icon: Ship,
        iconColor: 'text-accent',
        label: t('now.nextFerry'),
        answer: `${ferry.destination || ferry.route} — ${formatTime(ferry.departure_time)} (${getTimeRemaining(ferry.departure_time)})`,
        action: () => navigate('/transport'),
        priority: 2,
      });
    }

    // Parking
    cards.push({
      icon: Car,
      iconColor: parkingStatus === 'free' ? 'text-[hsl(var(--status-open))]' : 'text-primary',
      label: t('now.parking'),
      answer: parkingStatus === 'free' ? t('now.parkingFree') : t('now.parkingPaid'),
      action: () => navigate('/parking'),
      priority: 3,
    });

    // Weather advice
    if (weather) {
      cards.push({
        icon: weather.weatherCode > 60 ? CloudRain : Sunset,
        iconColor: 'text-accent',
        label: t('now.weatherAdvice'),
        answer: getWeatherAdvice(weather.weatherCode, weather.tempC, weather.windKmh, t),
        action: () => {},
        priority: 4,
      });
    }

    // Sunset if afternoon
    if (weather && hour >= 14) {
      cards.push({
        icon: Sunset,
        iconColor: 'text-orange-400',
        label: t('now.sunset'),
        answer: `🌅 ${weather.sunset}`,
        action: () => {},
        priority: 5,
      });
    }
  }

  if (slot === 'evening') {
    // Open food / bakery
    cards.push({
      icon: Fuel,
      iconColor: 'text-accent',
      label: t('now.open247'),
      answer: t('now.gasStation'),
      action: () => window.open('https://maps.google.com/?q=INA+Gaženica+Zadar', '_blank'),
      priority: 1,
    });

    // Last or first ferry tomorrow
    if (!ferryLoading) {
      if (isToday && ferry) {
        cards.push({
          icon: Ship,
          iconColor: 'text-orange-400',
          label: t('now.lastFerry'),
          answer: `${ferry.destination || ferry.route} — ${formatTime(ferry.departure_time)} (${getTimeRemaining(ferry.departure_time)})`,
          action: () => navigate('/transport'),
          priority: 2,
        });
      } else if (firstFerry) {
        cards.push({
          icon: Ship,
          iconColor: 'text-accent',
          label: t('now.firstFerry'),
          answer: `${firstFerry.destination || firstFerry.route} — ${formatTime(firstFerry.departure_time)}`,
          action: () => navigate('/transport'),
          priority: 2,
        });
      }
    }

    // Taxi
    cards.push({
      icon: Phone,
      iconColor: 'text-accent',
      label: t('now.taxi'),
      answer: t('now.taxiAvailable'),
      action: () => window.open('tel:023251400'),
      priority: 3,
    });

    // Night pharmacy
    cards.push({
      icon: Pill,
      iconColor: 'text-[hsl(var(--status-open))]',
      label: t('now.pharmacy'),
      answer: 'Ljekarna Jadran — 0-24',
      action: () => window.open('https://maps.app.goo.gl/MzSeHLC1RCqsJ45b6?g_st=ic', '_blank'),
      priority: 4,
    });
  }

  if (slot === 'night') {
    // First morning ferry
    if (!ferryLoading && firstFerry) {
      cards.push({
        icon: Ship,
        iconColor: 'text-accent',
        label: t('now.firstFerry'),
        answer: `${firstFerry.destination || firstFerry.route} — ${formatTime(firstFerry.departure_time)}`,
        action: () => navigate('/transport'),
        priority: 1,
      });
    }

    // Open now 0-24
    cards.push({
      icon: Fuel,
      iconColor: 'text-accent',
      label: t('now.open247'),
      answer: t('now.gasStation'),
      action: () => window.open('https://maps.google.com/?q=INA+Gaženica+Zadar', '_blank'),
      priority: 2,
    });

    // Gas station
    cards.push({
      icon: Fuel,
      iconColor: 'text-accent',
      label: t('now.open247'),
      answer: t('now.gasStation'),
      action: () => window.open('https://maps.google.com/?q=INA+Gaženica+Zadar', '_blank'),
      priority: 3,
    });

    // Emergency
    cards.push({
      icon: Stethoscope,
      iconColor: 'text-destructive',
      label: t('now.emergencyMedical'),
      answer: t('now.emergencyMedicalAnswer'),
      action: () => navigate('/emergency'),
      priority: 4,
    });

    // Taxi
    cards.push({
      icon: Phone,
      iconColor: 'text-accent',
      label: t('now.taxi'),
      answer: t('now.taxiAvailable'),
      action: () => window.open('tel:023251400'),
      priority: 5,
    });

    // Morning weather advice
    if (weather) {
      cards.push({
        icon: Sunrise,
        iconColor: 'text-amber-400',
        label: t('now.morningAdvice'),
        answer: getWeatherAdvice(weather.weatherCode, weather.tempC, weather.windKmh, t),
        action: () => {},
        priority: 6,
      });
    }
  }

  // Sort by priority, take top 6
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
