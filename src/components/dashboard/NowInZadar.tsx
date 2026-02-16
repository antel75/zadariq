import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Pill, Stethoscope, Ship, Car, CloudRain, Zap, Droplets, AlertTriangle, Sunset, Sunrise, Phone, MapPin, Fuel, ShieldAlert, Coffee, UtensilsCrossed, Film, ShoppingBag, Landmark } from 'lucide-react';
import { useSmartFerry, formatTime, getTimeRemaining } from '@/hooks/useTransportSchedules';
import { getParkingStatus } from '@/data/parkingData';
import { useWeather, getWindType } from '@/hooks/useWeather';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { type SituationalMode, getZadarHour } from '@/hooks/useSituationalMode';

// ── Types ──

interface NowCard {
  icon: React.ElementType;
  iconColor: string;
  label: string;
  answer: string;
  action: () => void;
  priority: number;
  isActionable: boolean;
}

// ── Helpers ──

function getWeatherAdvice(
  weatherCode: number, tempC: number, windKmh: number, t: (k: string) => string
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

const isNightHour = (h: number) => h >= 0 && h < 6;
const isEveningOrNight = (h: number) => h >= 20 || h < 6;

// ── Data hooks ──

function useDutyPharmacy() {
  const today = new Date().toISOString().split('T')[0];
  return useQuery({
    queryKey: ['duty-pharmacy', today],
    queryFn: async () => {
      const { data } = await supabase
        .from('duty_services')
        .select('name, phone, address, notes')
        .eq('type', 'pharmacy')
        .eq('enabled', true)
        .lte('valid_from', today)
        .gte('valid_until', today)
        .limit(1);
      return data && data.length > 0 ? data[0] : null;
    },
    staleTime: 10 * 60 * 1000,
  });
}

function useOpenNowPlaces() {
  return useQuery({
    queryKey: ['open-now-places'],
    queryFn: async () => {
      const { data } = await supabase
        .from('open_now_places')
        .select('*')
        .eq('enabled', true);
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
  });
}

function useCityContacts() {
  return useQuery({
    queryKey: ['city-contacts'],
    queryFn: async () => {
      const { data } = await supabase
        .from('city_contacts')
        .select('*')
        .eq('enabled', true);
      return data || [];
    },
    staleTime: 30 * 60 * 1000,
  });
}

function useTodayOutages() {
  const today = new Date().toISOString().split('T')[0];
  const power = useQuery({
    queryKey: ['power-outages-today', today],
    queryFn: async () => {
      const { data } = await supabase.from('power_outages').select('area, time_from, time_until').eq('outage_date', today);
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
  });
  const water = useQuery({
    queryKey: ['water-outages-today', today],
    queryFn: async () => {
      const { data } = await supabase.from('water_outages').select('area, time_from, time_until').eq('outage_date', today);
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
      return (res.data?.alerts || []) as Array<{ title: string; level: string; levelNum: number; type: string; description: string }>;
    },
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });
}

// ── Mode-aware priority boosts ──
// Each mode has categories it prioritizes

function getModePriorityBoost(mode: SituationalMode, cardType: string): number {
  const boosts: Record<SituationalMode, Record<string, number>> = {
    morning: {
      transport: 30,
      weatherAdvice: 25,
      parking: 20,
      bakery: 20,
      cafe: 15,
    },
    day: {
      shops: 20,
      institutions: 20,
      weatherAdvice: 15,
      events: 15,
      parking: 10,
    },
    evening: {
      restaurants: 25,
      cinema: 25,
      lastTransport: 30,
      parking: 20,
      events: 15,
    },
    night: {
      pharmacy: 30,
      emergency: 30,
      taxi: 25,
      open247: 25,
    },
    bad_weather: {
      weatherAlert: 40,
      weatherAdvice: 35,
      indoor: 20,
      pharmacy: 15,
      transport: 10,
    },
  };

  return boosts[mode]?.[cardType] || 0;
}

// ── Priority Selection Algorithm ──

function selectTopCards(
  candidates: NowCard[],
  fallbacks: NowCard[],
  hour: number
): NowCard[] {
  let pool = [...candidates];

  // Sort: priority desc, actionable first on tie
  pool.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return (b.isActionable ? 1 : 0) - (a.isActionable ? 1 : 0);
  });

  // If >4, prefer actionable
  if (pool.length > 4) {
    const actionable = pool.filter(c => c.isActionable);
    const informational = pool.filter(c => !c.isActionable);
    pool = [...actionable, ...informational].slice(0, 4);
    pool.sort((a, b) => b.priority - a.priority);
  }

  // Guarantee exactly 4: fill with fallbacks
  if (pool.length < 4) {
    for (const fb of fallbacks) {
      if (pool.length >= 4) break;
      if (!pool.some(c => c.label === fb.label)) {
        pool.push(fb);
      }
    }
  }

  return pool.slice(0, 4);
}

// ── Component ──

interface NowInZadarProps {
  mode?: SituationalMode;
}

export function NowInZadar({ mode = 'day' }: NowInZadarProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const hour = getZadarHour();

  // DB data
  const { data: dutyPharmacy } = useDutyPharmacy();
  const { data: openNowPlaces } = useOpenNowPlaces();
  const { data: cityContacts } = useCityContacts();
  const { ferry, firstFerry, isToday, isLoading: ferryLoading } = useSmartFerry();
  const { data: weather } = useWeather();
  const { powerOutages, waterOutages } = useTodayOutages();
  const { data: meteoAlerts } = useMeteoAlerts();
  const parkingStatus = getParkingStatus();

  // Derived contacts from DB
  const taxiContact = cityContacts?.find(c => c.type === 'taxi');
  const emergencyContact = cityContacts?.find(c => c.type === 'emergency');
  const open247Place = openNowPlaces?.find(p => p.open_247);

  const candidates: NowCard[] = [];

  // ── CRITICAL ALERTS (110+) — always highest ──

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
      priority: 115 + getModePriorityBoost(mode, 'weatherAlert'),
      isActionable: true,
    });
  }

  if (powerOutages.length > 0) {
    const first = powerOutages[0];
    const timeRange = first.time_from && first.time_until ? `${first.time_from}–${first.time_until}` : '';
    candidates.push({
      icon: Zap, iconColor: 'text-yellow-400', label: t('now.powerOutage'),
      answer: powerOutages.length > 1
        ? `⚡ ${powerOutages.length} ${t('now.areasAffected')}`
        : `⚡ ${first.area}${timeRange ? ` ${timeRange}` : ''}`,
      action: () => navigate('/utility-companies'),
      priority: 112, isActionable: true,
    });
  }

  if (waterOutages.length > 0) {
    candidates.push({
      icon: Droplets, iconColor: 'text-blue-400', label: t('now.waterOutage'),
      answer: waterOutages.length > 1
        ? `💧 ${waterOutages.length} ${t('now.areasAffected')}`
        : `💧 ${waterOutages[0].area}`,
      action: () => navigate('/utility-companies'),
      priority: 112, isActionable: true,
    });
  }

  // ── Health / Safety ──

  if (emergencyContact) {
    candidates.push({
      icon: ShieldAlert, iconColor: 'text-destructive',
      label: t('now.emergencyMedical'),
      answer: `${emergencyContact.name} — ${emergencyContact.phone}`,
      action: () => navigate('/emergency'),
      priority: 50 + getModePriorityBoost(mode, 'emergency'),
      isActionable: true,
    });
  }

  if (dutyPharmacy) {
    const pharmacyLabel = `${dutyPharmacy.name}${dutyPharmacy.notes ? ` — ${dutyPharmacy.notes}` : ''}`;
    candidates.push({
      icon: Pill, iconColor: 'text-[hsl(var(--status-open))]',
      label: t('now.pharmacy'),
      answer: pharmacyLabel,
      action: () => {
        if (dutyPharmacy.phone) window.open(`tel:${dutyPharmacy.phone}`);
        else navigate('/category/pharmacy?open=1');
      },
      priority: (mode === 'night' ? 105 : 80) + getModePriorityBoost(mode, 'pharmacy'),
      isActionable: true,
    });
  }

  // ── Movement ──

  if (taxiContact) {
    candidates.push({
      icon: Phone, iconColor: 'text-accent',
      label: t('now.taxi'),
      answer: t('now.taxiGoogleSearch'),
      action: () => window.open('https://www.google.com/search?q=taxi+zadar', '_blank'),
      priority: (isEveningOrNight(hour) ? 75 : 40) + getModePriorityBoost(mode, 'taxi'),
      isActionable: true,
    });
  }

  if (open247Place) {
    candidates.push({
      icon: Fuel, iconColor: 'text-accent',
      label: t('now.open247'),
      answer: open247Place.name,
      action: () => {
        if (open247Place.maps_url) window.open(open247Place.maps_url, '_blank');
      },
      priority: (isEveningOrNight(hour) ? 70 : 50) + getModePriorityBoost(mode, 'open247'),
      isActionable: true,
    });
  }

  // ── Transport (mode-aware) ──

  if (!ferryLoading) {
    if (isToday && ferry) {
      const isLate = hour >= 18;
      const cardType = isLate ? 'lastTransport' : 'transport';
      candidates.push({
        icon: Ship, iconColor: isLate ? 'text-orange-400' : 'text-accent',
        label: isLate ? t('now.lastFerry') : t('now.nextFerry'),
        answer: `${ferry.destination || ferry.route} — ${formatTime(ferry.departure_time)} (${getTimeRemaining(ferry.departure_time)})`,
        action: () => navigate('/transport'),
        priority: 70 + getModePriorityBoost(mode, cardType),
        isActionable: true,
      });
    } else if (firstFerry) {
      candidates.push({
        icon: Ship, iconColor: 'text-accent',
        label: t('now.firstFerry'),
        answer: `${firstFerry.destination || firstFerry.route} — ${formatTime(firstFerry.departure_time)}`,
        action: () => navigate('/transport'),
        priority: 60 + getModePriorityBoost(mode, 'transport'),
        isActionable: true,
      });
    }
  }

  // ── City navigation ──

  candidates.push({
    icon: Car,
    iconColor: parkingStatus === 'free' ? 'text-[hsl(var(--status-open))]' : 'text-primary',
    label: t('now.parking'),
    answer: parkingStatus === 'free' ? t('now.parkingFree') : t('now.parkingPaid'),
    action: () => navigate('/parking'),
    priority: 50 + getModePriorityBoost(mode, 'parking'),
    isActionable: true,
  });

  const crowdLevel = hour < 9 || hour >= 22 ? t('now.oldTownQuiet') : t('now.oldTownBusy');
  candidates.push({
    icon: MapPin, iconColor: 'text-[hsl(var(--status-open))]',
    label: t('now.oldTown'), answer: crowdLevel,
    action: () => {}, priority: (hour >= 8 && hour < 20) ? 50 : 20,
    isActionable: false,
  });

  // ── Mode-specific contextual cards ──

  // Morning: bakeries & cafes
  if (mode === 'morning') {
    candidates.push({
      icon: Coffee, iconColor: 'text-orange-400',
      label: t('mode.morningCafe'),
      answer: t('mode.morningCafeAnswer'),
      action: () => navigate('/category/cafes?open=1'),
      priority: 75 + getModePriorityBoost(mode, 'cafe'),
      isActionable: true,
    });
  }

  // Day: shops & institutions
  if (mode === 'day') {
    candidates.push({
      icon: ShoppingBag, iconColor: 'text-accent',
      label: t('mode.shopsOpen'),
      answer: t('mode.shopsOpenAnswer'),
      action: () => navigate('/category/shops?open=1'),
      priority: 55 + getModePriorityBoost(mode, 'shops'),
      isActionable: true,
    });
    candidates.push({
      icon: Landmark, iconColor: 'text-primary',
      label: t('mode.institutions'),
      answer: t('mode.institutionsAnswer'),
      action: () => navigate('/public-services'),
      priority: 50 + getModePriorityBoost(mode, 'institutions'),
      isActionable: true,
    });
  }

  // Evening: restaurants & cinema
  if (mode === 'evening') {
    candidates.push({
      icon: UtensilsCrossed, iconColor: 'text-orange-400',
      label: t('mode.restaurants'),
      answer: t('mode.restaurantsAnswer'),
      action: () => navigate('/category/restaurants?open=1'),
      priority: 75 + getModePriorityBoost(mode, 'restaurants'),
      isActionable: true,
    });
    candidates.push({
      icon: Film, iconColor: 'text-accent',
      label: t('mode.cinemaTonight'),
      answer: t('mode.cinemaTonightAnswer'),
      action: () => navigate('/cinema'),
      priority: 70 + getModePriorityBoost(mode, 'cinema'),
      isActionable: true,
    });
  }

  // Bad weather: indoor recommendation
  if (mode === 'bad_weather') {
    candidates.push({
      icon: Film, iconColor: 'text-accent',
      label: t('mode.indoorActivity'),
      answer: t('mode.indoorActivityAnswer'),
      action: () => navigate('/cinema'),
      priority: 80 + getModePriorityBoost(mode, 'indoor'),
      isActionable: true,
    });
  }

  // ── Informational ──

  if (weather) {
    candidates.push({
      icon: weather.weatherCode > 60 ? CloudRain : (hour < 12 ? Sunrise : Sunset),
      iconColor: 'text-accent',
      label: t('now.weatherAdvice'),
      answer: getWeatherAdvice(weather.weatherCode, weather.tempC, weather.windKmh, t),
      action: () => {}, 
      priority: 30 + getModePriorityBoost(mode, 'weatherAdvice'),
      isActionable: false,
    });
  }

  if (weather && hour >= 14 && hour < 21) {
    candidates.push({
      icon: Sunset, iconColor: 'text-orange-400',
      label: t('now.sunset'), answer: `🌅 ${weather.sunset}`,
      action: () => {}, priority: 35, isActionable: false,
    });
  }

  // ── Fallbacks (guaranteed fill to 4) ──
  const fallbacks: NowCard[] = [
    {
      icon: ShieldAlert, iconColor: 'text-destructive',
      label: t('now.emergencyMedical'),
      answer: emergencyContact ? `${emergencyContact.name} — ${emergencyContact.phone}` : '194',
      action: () => navigate('/emergency'),
      priority: 110, isActionable: true,
    },
    {
      icon: Pill, iconColor: 'text-muted-foreground',
      label: t('now.pharmacy'),
      answer: dutyPharmacy ? `${dutyPharmacy.name}` : t('now.pharmacyNoData'),
      action: () => navigate('/category/pharmacy?open=1'),
      priority: 100, isActionable: true,
    },
    {
      icon: Phone, iconColor: 'text-accent',
      label: t('now.taxi'),
      answer: t('now.taxiGoogleSearch'),
      action: () => window.open('https://www.google.com/search?q=taxi+zadar', '_blank'),
      priority: 90, isActionable: true,
    },
    {
      icon: Fuel, iconColor: 'text-accent',
      label: t('now.open247'),
      answer: open247Place?.name || t('now.gasStation'),
      action: () => { if (open247Place?.maps_url) window.open(open247Place.maps_url, '_blank'); },
      priority: 80, isActionable: true,
    },
  ];

  const topCards = selectTopCards(candidates, fallbacks, hour);

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
