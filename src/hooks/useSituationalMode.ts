import { useWeather } from '@/hooks/useWeather';

export type SituationalMode = 'morning' | 'day' | 'evening' | 'night' | 'bad_weather';

export interface ModeConfig {
  mode: SituationalMode;
  /** The base mode before bad_weather override */
  baseMode: SituationalMode;
  isBadWeather: boolean;
  labelKey: string;
  emoji: string;
  /** Which sections to show on Index */
  showSections: {
    quickActions: boolean;
    search: boolean;
    alerts: boolean;
    transport: boolean;
    todayCard: boolean;
    categories: boolean;
    featuredNearby: boolean;
    forYou: boolean;
    trending: boolean;
    nearbyOpen: boolean;
  };
}

function getBaseMode(hour: number): Exclude<SituationalMode, 'bad_weather'> {
  if (hour >= 5 && hour < 10) return 'morning';
  if (hour >= 10 && hour < 17) return 'day';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

function isBadWeatherCondition(weatherCode: number, windKmh: number): boolean {
  // Rain (51-67), heavy rain (80-82), storm (95-99), fog (40-48), bura (>40km/h)
  if (weatherCode >= 51 && weatherCode <= 67) return true;
  if (weatherCode >= 80) return true;
  if (weatherCode >= 40 && weatherCode <= 48) return true;
  if (windKmh >= 40) return true;
  return false;
}

const sectionsByMode: Record<SituationalMode, ModeConfig['showSections']> = {
  morning: {
    quickActions: true,
    search: true,
    alerts: true,
    transport: true,
    todayCard: true,
    categories: true,
    featuredNearby: false,
    forYou: true,
    trending: false,
    nearbyOpen: false,
  },
  day: {
    quickActions: true,
    search: true,
    alerts: true,
    transport: true,
    todayCard: true,
    categories: true,
    featuredNearby: true,
    forYou: true,
    trending: true,
    nearbyOpen: true,
  },
  evening: {
    quickActions: true,
    search: true,
    alerts: true,
    transport: true,
    todayCard: false,
    categories: true,
    featuredNearby: true,
    forYou: true,
    trending: true,
    nearbyOpen: false,
  },
  night: {
    quickActions: true,
    search: true,
    alerts: true,
    transport: true,
    todayCard: true,
    categories: true,
    featuredNearby: false,
    forYou: false,
    trending: false,
    nearbyOpen: false,
  },
  bad_weather: {
    quickActions: true,
    search: true,
    alerts: true,
    transport: true,
    todayCard: true,
    categories: true,
    featuredNearby: false,
    forYou: false,
    trending: false,
    nearbyOpen: false,
  },
};

const modeEmoji: Record<SituationalMode, string> = {
  morning: '🌅',
  day: '☀️',
  evening: '🌆',
  night: '🌙',
  bad_weather: '⛈️',
};

export function getZadarHour(): number {
  const zadarTime = new Date().toLocaleString('en-US', {
    timeZone: 'Europe/Zagreb',
    hour: 'numeric',
    hour12: false,
  });
  return parseInt(zadarTime, 10);
}

export function useSituationalMode(): ModeConfig {
  const { data: weather } = useWeather();
  const hour = getZadarHour();
  
  const baseMode = getBaseMode(hour);
  const badWeather = weather 
    ? isBadWeatherCondition(weather.weatherCode, weather.windKmh) 
    : false;
  
  // Bad weather overrides day and evening modes (not night — night already minimal)
  const effectiveMode: SituationalMode = 
    badWeather && (baseMode === 'day' || baseMode === 'evening') 
      ? 'bad_weather' 
      : baseMode;

  return {
    mode: effectiveMode,
    baseMode,
    isBadWeather: badWeather,
    labelKey: `mode.${effectiveMode}`,
    emoji: modeEmoji[effectiveMode],
    showSections: sectionsByMode[effectiveMode],
  };
}
