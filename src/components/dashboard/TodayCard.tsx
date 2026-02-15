import { useLanguage } from '@/contexts/LanguageContext';
import { Thermometer, Cloud, Shirt, Users, Car, Waves, Loader2 } from 'lucide-react';
import { useWeather } from '@/hooks/useWeather';
import { getParkingStatus } from '@/data/parkingData';

// ── Semantic Logic ──

function getFeelKey(tempC: number, windKmh: number, humidity: number, isDay: boolean): string {
  let base: string;
  if (tempC < 5) base = 'veryCold';
  else if (tempC < 12) base = 'cold';
  else if (tempC < 20) base = 'pleasant';
  else if (tempC < 28) base = 'warm';
  else base = 'hot';

  if (windKmh > 20) return `${base}Windy`;
  if (humidity > 70 && tempC > 20) return `${base}Humid`;
  if (!isDay) return `${base}Night`;
  return base;
}

function getWeatherAdviceKey(code: number): string {
  if (code >= 80) return 'stayInside';
  if (code >= 51) return 'bringUmbrella';
  if (code >= 40 && code <= 48) return 'foggy';
  if (code <= 3) return 'idealOutside';
  return 'neutral';
}

function getClothingKey(tempC: number): string {
  if (tempC < 10) return 'jacket';
  if (tempC < 18) return 'longClothes';
  if (tempC < 25) return 'lightClothes';
  return 'shorts';
}

function getCrowdKey(hour: number): string {
  const month = new Date().getMonth();
  const day = new Date().getDay();
  const isSummer = month >= 5 && month <= 8;
  const isWeekend = day === 0 || day === 6;

  let level: number;
  if (hour < 7) level = 0;
  else if (hour < 10) level = 1;
  else if (hour < 17) level = 2;
  else if (hour < 21) level = 3;
  else level = 1;

  if (isWeekend && level < 4) level++;
  if (isSummer && level < 4) level++;

  if (level <= 0) return 'empty';
  if (level <= 1) return 'fewPeople';
  if (level <= 2) return 'moderate';
  if (level <= 3) return 'crowded';
  return 'packed';
}

function getParkingSemanticKey(hour: number): string {
  if (hour >= 20 || hour < 7) return 'free';
  if (hour < 11) return 'available';
  if (hour < 17) return 'hardToFind';
  return 'almostImpossible';
}

function getSeaKey(seaTempC: number): string {
  if (seaTempC < 18) return 'cold';
  if (seaTempC < 23) return 'fresh';
  if (seaTempC < 26) return 'pleasant';
  return 'warm';
}

// ── Semantic color helpers ──

function getFeelColor(key: string): string {
  if (key.startsWith('veryCold') || key.startsWith('cold')) return 'text-blue-400';
  if (key.startsWith('hot')) return 'text-red-400';
  if (key.startsWith('warm')) return 'text-orange-400';
  return 'text-[hsl(var(--status-open))]';
}

function getWeatherColor(key: string): string {
  if (key === 'stayInside') return 'text-destructive';
  if (key === 'bringUmbrella') return 'text-blue-400';
  if (key === 'foggy') return 'text-muted-foreground';
  return 'text-[hsl(var(--status-open))]';
}

function getCrowdColor(key: string): string {
  if (key === 'empty' || key === 'fewPeople') return 'text-[hsl(var(--status-open))]';
  if (key === 'moderate') return 'text-[hsl(var(--status-warning))]';
  return 'text-[hsl(var(--status-closed))]';
}

function getParkingColor(key: string): string {
  if (key === 'free') return 'text-[hsl(var(--status-open))]';
  if (key === 'available') return 'text-[hsl(var(--status-open))]';
  if (key === 'hardToFind') return 'text-[hsl(var(--status-warning))]';
  return 'text-[hsl(var(--status-closed))]';
}

function getSeaColor(key: string): string {
  if (key === 'cold') return 'text-blue-400';
  if (key === 'fresh') return 'text-cyan-400';
  return 'text-[hsl(var(--status-open))]';
}

// ── Component ──

export function TodayCard() {
  const { t } = useLanguage();
  const { data: weather, loading } = useWeather();
  const hour = new Date().getHours();
  const seaTempC = 15; // mock

  if (loading) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-card border border-border p-4">
        <h2 className="text-sm font-semibold text-foreground mb-3">{t('dashboard.today')}</h2>
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const tempC = weather?.tempC ?? 15;
  const windKmh = weather?.windKmh ?? 0;
  const humidity = weather?.humidity ?? 50;
  const isDay = weather?.isDay ?? true;
  const weatherCode = weather?.weatherCode ?? 0;

  const feelKey = getFeelKey(tempC, windKmh, humidity, isDay);
  const weatherAdviceKey = getWeatherAdviceKey(weatherCode);
  const clothingKey = getClothingKey(tempC);
  const crowdKey = getCrowdKey(hour);
  const parkingKey = getParkingSemanticKey(hour);
  const seaKey = getSeaKey(seaTempC);

  const cards = [
    {
      icon: Thermometer,
      label: t('today.feelLabel'),
      value: t(`today.feel.${feelKey}`),
      sub: `${tempC}°C`,
      color: getFeelColor(feelKey),
      iconColor: 'text-orange-400',
    },
    {
      icon: Cloud,
      label: t('today.weatherLabel'),
      value: t(`today.weather.${weatherAdviceKey}`),
      sub: t(`weather.${weather ? (weatherCode === 0 ? (isDay ? 'sunny' : 'clear_night') : weatherCode <= 3 ? 'partly_cloudy' : weatherCode <= 48 ? 'foggy' : weatherCode <= 67 ? 'rainy' : 'stormy') : 'sunny'}`),
      color: getWeatherColor(weatherAdviceKey),
      iconColor: 'text-blue-400',
    },
    {
      icon: Shirt,
      label: t('today.clothingLabel'),
      value: t(`today.clothing.${clothingKey}`),
      sub: `${tempC}°C · ${windKmh} km/h`,
      color: 'text-foreground',
      iconColor: 'text-accent',
    },
    {
      icon: Users,
      label: t('today.crowdLabel'),
      value: t(`today.crowd.${crowdKey}`),
      sub: t('dashboard.crowd'),
      color: getCrowdColor(crowdKey),
      iconColor: 'text-muted-foreground',
    },
    {
      icon: Car,
      label: t('today.parkingLabel'),
      value: t(`today.parking.${parkingKey}`),
      sub: t('dashboard.parking'),
      color: getParkingColor(parkingKey),
      iconColor: 'text-muted-foreground',
    },
    {
      icon: Waves,
      label: t('today.seaLabel'),
      value: t(`today.sea.${seaKey}`),
      sub: `${seaTempC}°C`,
      color: getSeaColor(seaKey),
      iconColor: 'text-accent',
    },
  ];

  return (
    <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-card border border-border p-4">
      <h2 className="text-sm font-semibold text-foreground mb-3">{t('dashboard.today')}</h2>
      <div className="grid grid-cols-3 gap-3">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="flex flex-col items-center gap-1 text-center">
              <Icon className={`h-5 w-5 ${card.iconColor}`} />
              <span className={`text-sm font-bold leading-tight ${card.color}`}>{card.value}</span>
              <span className="text-[10px] text-muted-foreground">{card.sub}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
