import { useEffect, useState } from 'react';
import { validSunday, zagrebDate } from '@/lib/radar/calendar';
import { RadarBanner } from './RadarBanner';
import { SundayRadarBanner } from './SundayRadarBanner';

function isSundayInZadar() {
  return validSunday(zagrebDate());
}

export function HomeRadarBanner() {
  const [isSunday, setIsSunday] = useState(isSundayInZadar);

  useEffect(() => {
    const refresh = () => setIsSunday(isSundayInZadar());
    const timer = setInterval(refresh, 30000);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  return isSunday ? <SundayRadarBanner /> : <RadarBanner />;
}
