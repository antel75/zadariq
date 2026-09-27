import { useEffect, useState } from 'react';
import { zagrebDate } from '@/lib/radar/calendar';
import { RadarBanner } from './RadarBanner';
import { SundayRadarBanner } from './SundayRadarBanner';

function dayInZadar() {
  return new Date(`${zagrebDate()}T12:00:00Z`).getUTCDay();
}

export function HomeRadarBanner() {
  const [day, setDay] = useState(dayInZadar);

  useEffect(() => {
    const refresh = () => setDay(dayInZadar());
    const timer = setInterval(refresh, 30000);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  return day === 0 ? <SundayRadarBanner /> : <RadarBanner showSundayLink={day >= 3} />;
}
