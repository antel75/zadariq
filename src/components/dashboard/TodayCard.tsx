import { useLanguage } from '@/contexts/LanguageContext';
import { Waves, Sunset, Wind, Users, Car, Loader2 } from 'lucide-react';
import { useWeather, getWeatherInfo, getWindType } from '@/hooks/useWeather';

function getMockCityData() {
  const hour = new Date().getHours();
  return {
    seaTempC: 15,
    crowdLevel: hour >= 10 && hour <= 18 ? (hour >= 12 && hour <= 15 ? 'high' : 'medium') : 'low',
    parkingPressure: hour >= 9 && hour <= 17 ? (hour >= 11 && hour <= 14 ? 'full' : 'normal') : 'easy',
  };
}

const crowdColors: Record<string, string> = {
  low: 'text-[hsl(var(--status-open))]',
  medium: 'text-[hsl(var(--status-warning))]',
  high: 'text-[hsl(var(--status-closed))]',
};

const parkingColors: Record<string, string> = {
  easy: 'text-[hsl(var(--status-open))]',
  normal: 'text-[hsl(var(--status-warning))]',
  full: 'text-[hsl(var(--status-closed))]',
};

export function TodayCard() {
  const { t } = useLanguage();
  const { data: weather, loading } = useWeather();
  const city = getMockCityData();

  const weatherIcon = weather ? getWeatherInfo(weather.weatherCode, weather.isDay).icon : '⏳';
  const conditionKey = weather ? getWeatherInfo(weather.weatherCode, weather.isDay).conditionKey : 'sunny';
  const windType = weather ? getWindType(weather.windKmh) : 'calm';

  return (
    <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-card border border-border p-4">
      <h2 className="text-sm font-semibold text-foreground mb-3">{t('dashboard.today')}</h2>
      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
      <div className="grid grid-cols-3 gap-3">
        {/* Weather */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-2xl">{weatherIcon}</span>
          <span className="text-lg font-bold text-foreground">{weather?.tempC ?? '--'}°</span>
          <span className="text-[10px] text-muted-foreground">{t(`weather.${conditionKey}`)}</span>
        </div>

        {/* Sea temp */}
        <div className="flex flex-col items-center gap-1">
          <Waves className="h-5 w-5 text-accent" />
          <span className="text-lg font-bold text-foreground">{city.seaTempC}°</span>
          <span className="text-[10px] text-muted-foreground">{t('dashboard.sea')}</span>
        </div>

        {/* Sunset */}
        <div className="flex flex-col items-center gap-1">
          <Sunset className="h-5 w-5 text-[hsl(var(--status-warning))]" />
          <span className="text-lg font-bold text-foreground">{weather?.sunset ?? '--:--'}</span>
          <span className="text-[10px] text-muted-foreground">{t('dashboard.sunset')}</span>
        </div>

        {/* Wind */}
        <div className="flex flex-col items-center gap-1">
          <Wind className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">{weather?.windKmh ?? '--'} km/h</span>
          <span className="text-[10px] text-muted-foreground">{t(`wind.${windType}`)}</span>
        </div>

        {/* Crowd */}
        <div className="flex flex-col items-center gap-1">
          <Users className="h-5 w-5 text-muted-foreground" />
          <span className={`text-sm font-semibold ${crowdColors[city.crowdLevel]}`}>
            {t(`crowd.${city.crowdLevel}`)}
          </span>
          <span className="text-[10px] text-muted-foreground">{t('dashboard.crowd')}</span>
        </div>

        {/* Parking */}
        <div className="flex flex-col items-center gap-1">
          <Car className="h-5 w-5 text-muted-foreground" />
          <span className={`text-sm font-semibold ${parkingColors[city.parkingPressure]}`}>
            {t(`parking.${city.parkingPressure}`)}
          </span>
          <span className="text-[10px] text-muted-foreground">{t('dashboard.parking')}</span>
        </div>
      </div>
      )}
    </div>
  );
}
