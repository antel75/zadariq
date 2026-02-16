import { useLanguage } from '@/contexts/LanguageContext';
import { type ModeConfig } from '@/hooks/useSituationalMode';
import { Sunrise, Sun, Sunset, Moon, CloudRain } from 'lucide-react';
import { type LucideIcon } from 'lucide-react';

const modeIcons: Record<string, LucideIcon> = {
  morning: Sunrise,
  day: Sun,
  evening: Sunset,
  night: Moon,
  bad_weather: CloudRain,
};

const modeColors: Record<string, string> = {
  morning: 'text-orange-400',
  day: 'text-yellow-500',
  evening: 'text-purple-400',
  night: 'text-blue-400',
  bad_weather: 'text-destructive',
};

interface ModeIndicatorProps {
  config: ModeConfig;
}

export function ModeIndicator({ config }: ModeIndicatorProps) {
  const { t } = useLanguage();
  const Icon = modeIcons[config.mode] || Sun;
  const color = modeColors[config.mode] || 'text-accent';

  return (
    <div className="flex items-center gap-2 mb-1">
      <Icon className={`h-3.5 w-3.5 ${color}`} />
      <span className={`text-xs font-semibold ${color}`}>
        {config.emoji} {t(config.labelKey)}
      </span>
      {config.isBadWeather && config.mode === 'bad_weather' && (
        <span className="text-[10px] bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-medium">
          {t('mode.badWeatherAlert')}
        </span>
      )}
    </div>
  );
}
