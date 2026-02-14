// Parking data scraped from oil.hr — Zadar parking zones and pricing

export interface ParkingZone {
  id: string;
  name: string;
  smsCode: string;
  winter: { eurPerHour: number; eurPerDay: number | null };
  summer: { eurPerHour: number; eurPerDay: number | null };
  peakSummer: { eurPerHour: number; eurPerDay: number | null }; // 15.6-31.8
  note?: string;
}

export interface ParkingNotice {
  id: string;
  titleKey: string;
  descKey: string;
  validFrom?: string;
  validUntil?: string;
}

export const parkingZones: ParkingZone[] = [
  {
    id: 'zona-0',
    name: 'Zona 0',
    smsCode: '708239',
    winter: { eurPerHour: 0.80, eurPerDay: null },
    summer: { eurPerHour: 0.80, eurPerDay: null },
    peakSummer: { eurPerHour: 1.60, eurPerDay: null },
    note: 'MAX 1h — rezervirano za stanare poluotoka',
  },
  {
    id: 'zona-1',
    name: 'Zona 1',
    smsCode: '708231',
    winter: { eurPerHour: 0.80, eurPerDay: 6.40 },
    summer: { eurPerHour: 0.80, eurPerDay: 11.20 },
    peakSummer: { eurPerHour: 1.60, eurPerDay: 22.40 },
  },
  {
    id: 'zona-2',
    name: 'Zona 2',
    smsCode: '708232',
    winter: { eurPerHour: 0.50, eurPerDay: 4.00 },
    summer: { eurPerHour: 0.50, eurPerDay: 7.00 },
    peakSummer: { eurPerHour: 1.30, eurPerDay: 18.20 },
  },
  {
    id: 'zona-3',
    name: 'Zona 3',
    smsCode: '708233',
    winter: { eurPerHour: 0.40, eurPerDay: 3.20 },
    summer: { eurPerHour: 0.40, eurPerDay: 5.60 },
    peakSummer: { eurPerHour: 0.40, eurPerDay: 5.60 },
  },
  {
    id: 'zona-4',
    name: 'Zona 4',
    smsCode: '708234',
    winter: { eurPerHour: 0.30, eurPerDay: 2.40 },
    summer: { eurPerHour: 0.30, eurPerDay: 4.20 },
    peakSummer: { eurPerHour: 0.30, eurPerDay: 4.20 },
  },
  {
    id: 'kolodvor',
    name: 'Kolodvor',
    smsCode: '702301',
    winter: { eurPerHour: 0.50, eurPerDay: null },
    summer: { eurPerHour: 0.50, eurPerDay: null },
    peakSummer: { eurPerHour: 0.50, eurPerDay: null },
    note: '1. sat besplatan',
  },
  {
    id: 'petrcane',
    name: 'Petrčane',
    smsCode: '708230',
    winter: { eurPerHour: 0, eurPerDay: 0 },
    summer: { eurPerHour: 0, eurPerDay: 0 },
    peakSummer: { eurPerHour: 0.30, eurPerDay: 4.20 },
  },
];

export type ParkingRegime = 'winter' | 'summer' | 'peakSummer';
export type ParkingStatus = 'free' | 'paid';

/**
 * Determine the current parking season/regime
 */
export function getCurrentRegime(date: Date = new Date()): ParkingRegime {
  const m = date.getMonth() + 1; // 1-12
  const d = date.getDate();
  // Peak summer: 15.6 - 31.8
  if ((m === 6 && d >= 15) || m === 7 || m === 8) return 'peakSummer';
  // Summer: 1.5 - 14.6, 1.9 - 30.9
  if (m === 5 || (m === 6 && d < 15) || m === 9) return 'summer';
  // Winter: 1.10 - 30.4
  return 'winter';
}

/**
 * Determine if parking is currently free based on oil.hr rules
 */
export function getParkingStatus(date: Date = new Date()): ParkingStatus {
  const regime = getCurrentRegime(date);
  const day = date.getDay(); // 0=Sun
  const hour = date.getHours();
  const minute = date.getMinutes();
  const timeInMinutes = hour * 60 + minute;

  // Sunday: always free in winter/summer, paid in peak summer (15.6-31.8)
  if (day === 0) {
    return regime === 'peakSummer' ? 'paid' : 'free';
  }

  if (regime === 'winter') {
    // Mon-Fri: 8:00-16:00, Sat: 8:00-14:00
    if (day === 6) {
      return (timeInMinutes >= 480 && timeInMinutes < 840) ? 'paid' : 'free'; // 8:00-14:00
    }
    return (timeInMinutes >= 480 && timeInMinutes < 960) ? 'paid' : 'free'; // 8:00-16:00
  }

  // Summer & peak summer: Mon-Sat 8:00-22:00
  return (timeInMinutes >= 480 && timeInMinutes < 1320) ? 'paid' : 'free'; // 8:00-22:00
}

/**
 * Get a descriptive string for the current parking hours
 */
export function getParkingHoursLabel(date: Date = new Date()): string {
  const regime = getCurrentRegime(date);
  if (regime === 'winter') {
    const day = date.getDay();
    if (day === 0) return 'Besplatno nedjeljom';
    if (day === 6) return '08:00 – 14:00';
    return '08:00 – 16:00';
  }
  const day = date.getDay();
  if (day === 0 && regime !== 'peakSummer') return 'Besplatno nedjeljom';
  return '08:00 – 22:00';
}

export function getRegimeLabel(regime: ParkingRegime): Record<string, string> {
  switch (regime) {
    case 'winter': return { hr: 'Zimski režim', en: 'Winter regime', de: 'Winterregelung', it: 'Regime invernale' };
    case 'summer': return { hr: 'Ljetni režim', en: 'Summer regime', de: 'Sommerregelung', it: 'Regime estivo' };
    case 'peakSummer': return { hr: 'Ljetni režim (vrh)', en: 'Peak summer', de: 'Hochsommer', it: 'Alta stagione' };
  }
}
