import { useLanguage } from '@/contexts/LanguageContext';
import { useOutdoorRecommendation, type OutdoorSeverity } from '@/hooks/useOutdoorRecommendation';
import { Leaf, Sun, CloudRain, Wind, AlertTriangle } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

const iconMap = {
  'leaf': Leaf,
  'sun': Sun,
  'cloud-rain': CloudRain,
  'wind': Wind,
  'alert-triangle': AlertTriangle,
} as const;

const severityStyles: Record<OutdoorSeverity, string> = {
  good: 'bg-[hsl(var(--status-open))]/10 border-[hsl(var(--status-open))]/25 text-[hsl(var(--status-open))]',
  ok: 'bg-accent/10 border-accent/20 text-accent',
  bad: 'bg-[hsl(var(--status-warning))]/10 border-[hsl(var(--status-warning))]/25 text-[hsl(var(--status-warning))]',
  danger: 'bg-destructive/10 border-destructive/25 text-destructive',
};

const iconColorMap: Record<OutdoorSeverity, string> = {
  good: 'text-[hsl(var(--status-open))]',
  ok: 'text-accent',
  bad: 'text-[hsl(var(--status-warning))]',
  danger: 'text-destructive',
};

export function OutdoorAdviceBanner() {
  const { t } = useLanguage();
  const rec = useOutdoorRecommendation();
  const [searchParams] = useSearchParams();
  const isDebug = searchParams.get('debug') === '1';

  const Icon = iconMap[rec.iconName];
  const style = severityStyles[rec.severity];
  const iconColor = iconColorMap[rec.severity];

  const handleClick = () => {
    if (rec.action) {
      if (rec.action.type === 'open_url') {
        window.open(rec.action.value, '_blank');
      }
    }
  };

  const updatedTime = rec.fetchedAt
    ? new Date(rec.fetchedAt).toLocaleTimeString('hr-HR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Zagreb',
      })
    : null;

  return (
    <button
      onClick={handleClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all hover:opacity-90 active:scale-[0.98] ${style} ${rec.action ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <Icon className={`h-5 w-5 flex-shrink-0 ${iconColor}`} />
      <div className="flex-1 text-left min-w-0">
        <p className="text-xs font-semibold leading-tight">{t(rec.labelKey)}</p>
        <p className="text-[11px] opacity-80 leading-tight mt-0.5">{t(rec.reasonKey)}</p>
        {isDebug && rec.debug && (
          <p className="text-[9px] font-mono opacity-60 mt-1">
            w:{rec.debug.windKmh} g:{rec.debug.windGustKmh} p:{rec.debug.precipMm}mm prob:{rec.debug.precipProb}% wc:{rec.debug.weatherCode} alert:{rec.debug.meteoAlertLevel ?? '–'}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {updatedTime && (
          <span className="text-[9px] opacity-50 flex-shrink-0 self-end">
            {t('outdoor.updated')} {updatedTime}
          </span>
        )}
        <span className="text-[9px] opacity-40 flex-shrink-0 self-end ml-auto">Izvor: Open-Meteo</span>
      </div>
    </button>
  );
}
