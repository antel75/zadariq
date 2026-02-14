import { useLanguage } from '@/contexts/LanguageContext';
import { Sun, Waves, Sunset, Wind, Users, Car } from 'lucide-react';

// Mock daily data — future: fetch from weather API
function getMockTodayData() {
  const hour = new Date().getHours();
  const isEvening = hour >= 18;
  return {
    weatherIcon: isEvening ? '🌙' : '☀️',
    tempC: isEvening ? 14 : 19,
    condition: isEvening ? 'clear_night' : 'sunny',
    seaTempC: 15,
    sunset: '17:42',
    wind: hour >= 12 ? 'bura' : 'calm',
    windKmh: hour >= 12 ? 35 : 8,
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
  const data = getMockTodayData();

  return (
    <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-card border border-border p-4">
      <h2 className="text-sm font-semibold text-foreground mb-3">{t('dashboard.today')}</h2>
      <div className="grid grid-cols-3 gap-3">
        {/* Weather */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-2xl">{data.weatherIcon}</span>
          <span className="text-lg font-bold text-foreground">{data.tempC}°</span>
          <span className="text-[10px] text-muted-foreground">{t(`weather.${data.condition}`)}</span>
        </div>

        {/* Sea temp */}
        <div className="flex flex-col items-center gap-1">
          <Waves className="h-5 w-5 text-accent" />
          <span className="text-lg font-bold text-foreground">{data.seaTempC}°</span>
          <span className="text-[10px] text-muted-foreground">{t('dashboard.sea')}</span>
        </div>

        {/* Sunset */}
        <div className="flex flex-col items-center gap-1">
          <Sunset className="h-5 w-5 text-[hsl(var(--status-warning))]" />
          <span className="text-lg font-bold text-foreground">{data.sunset}</span>
          <span className="text-[10px] text-muted-foreground">{t('dashboard.sunset')}</span>
        </div>

        {/* Wind */}
        <div className="flex flex-col items-center gap-1">
          <Wind className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">{data.windKmh} km/h</span>
          <span className="text-[10px] text-muted-foreground">{t(`wind.${data.wind}`)}</span>
        </div>

        {/* Crowd */}
        <div className="flex flex-col items-center gap-1">
          <Users className="h-5 w-5 text-muted-foreground" />
          <span className={`text-sm font-semibold ${crowdColors[data.crowdLevel]}`}>
            {t(`crowd.${data.crowdLevel}`)}
          </span>
          <span className="text-[10px] text-muted-foreground">{t('dashboard.crowd')}</span>
        </div>

        {/* Parking */}
        <div className="flex flex-col items-center gap-1">
          <Car className="h-5 w-5 text-muted-foreground" />
          <span className={`text-sm font-semibold ${parkingColors[data.parkingPressure]}`}>
            {t(`parking.${data.parkingPressure}`)}
          </span>
          <span className="text-[10px] text-muted-foreground">{t('dashboard.parking')}</span>
        </div>
      </div>
    </div>
  );
}
