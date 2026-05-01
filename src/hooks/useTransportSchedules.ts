import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type TransportType = 'ferry' | 'catamaran' | 'city_bus' | 'intercity_bus';
export type BoardingStatus = 'boarding' | 'closed' | 'delayed' | 'scheduled';

export interface TransportSchedule {
  id: string;
  type: TransportType;
  line_name: string;
  departure_time: string; // HH:mm:ss
  destination: string | null;
  carrier: string | null;
  route: string | null;
  port_or_station: string | null;
  platform: string | null;
  days_of_week: number[] | null;
}

function getMinutesUntil(timeStr: string): number {
  const now = new Date();
  const parts = timeStr.split(':').map(Number);
  const [h, m] = parts;
  const target = new Date();
  target.setHours(h, m, 0, 0);
  // Don't wrap to next day — if departure passed today, return negative
  return Math.round((target.getTime() - now.getTime()) / 60000);
}

export function getTimeRemaining(timeStr: string): string {
  const mins = getMinutesUntil(timeStr);
  if (mins < 1) return 'sada';
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function formatTime(timeStr: string): string {
  // Convert HH:mm:ss to HH:mm
  return timeStr.substring(0, 5);
}

export function getBoardingStatus(timeStr: string): BoardingStatus {
  const mins = getMinutesUntil(timeStr);
  if (mins <= 0) return 'closed';
  if (mins <= 15) return 'boarding';
  return 'scheduled';
}

export function useTransportSchedules(types?: TransportType[]) {
  return useQuery({
    queryKey: ['transport-schedules', types],
    queryFn: async () => {
      // Get current day of week (1=Mon ... 7=Sun)
      const now = new Date();
      const jsDay = now.getDay(); // 0=Sun, 1=Mon...
      let isoDay = jsDay === 0 ? 7 : jsDay;

      // Check if today is a public holiday → treat as Sunday (day 7)
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const { data: holiday } = await supabase
        .from('public_holidays')
        .select('holiday_date')
        .eq('holiday_date', todayStr)
        .maybeSingle();
      if (holiday) {
        isoDay = 7;
      }

      let query = supabase
        .from('transport_schedules')
        .select('id, type, line_name, departure_time, destination, carrier, route, port_or_station, platform, days_of_week')
        .eq('enabled', true)
        .order('departure_time', { ascending: true });

      if (types && types.length > 0) {
        query = query.in('type', types);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Filter by day of week (null = every day)
      const filtered = (data || []).filter((s: any) => 
        s.days_of_week === null || s.days_of_week.includes(isoDay)
      );
      return filtered as TransportSchedule[];
    },
    staleTime: 5 * 60 * 1000, // 5 min cache
  });
}

export function useNextFerry() {
  const { data: schedules, ...rest } = useTransportSchedules(['ferry', 'catamaran']);
  
  const nextFerry = schedules?.find(s => {
    const status = getBoardingStatus(s.departure_time);
    return status === 'boarding' || status === 'scheduled';
  }) || null;

  return { nextFerry, ...rest };
}

export function useNextBusDeparture(lineId?: string) {
  const { data: schedules, ...rest } = useTransportSchedules(['city_bus']);
  
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  
  const filtered = schedules?.filter(s => {
    if (lineId && s.line_name !== lineId) return false;
    const [h, m] = s.departure_time.split(':').map(Number);
    return h * 60 + m > nowMins;
  }) || [];

  return { nextBuses: filtered, ...rest };
}

/** Returns next ferry/catamaran, or first one tomorrow if none left today */
export function useSmartFerry() {
  const { data: schedules, ...rest } = useTransportSchedules(['ferry', 'catamaran']);
  
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();

  // Find next upcoming today
  const nextToday = schedules?.find(s => {
    const [h, m] = s.departure_time.split(':').map(Number);
    return h * 60 + m > nowMins;
  }) || null;

  // First departure of the day (for "first morning ferry" fallback)
  const firstTomorrow = schedules?.[0] || null;

  return {
    ferry: nextToday,
    firstFerry: firstTomorrow,
    isToday: !!nextToday,
    ...rest,
  };
}
