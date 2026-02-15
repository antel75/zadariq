import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Clock } from 'lucide-react';

export function ZadarClock() {
  const { t } = useLanguage();
  const [time, setTime] = useState(() => getZadarTime());

  useEffect(() => {
    const interval = setInterval(() => setTime(getZadarTime()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center gap-2 py-2">
      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-sm font-mono font-semibold text-foreground tracking-wider tabular-nums">
        {time}
      </span>
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
        {t('clock.zadarTime')}
      </span>
    </div>
  );
}

function getZadarTime(): string {
  const now = new Date();
  return now.toLocaleTimeString('hr-HR', {
    timeZone: 'Europe/Zagreb',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}
