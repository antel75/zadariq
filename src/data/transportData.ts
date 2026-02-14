export type BoardingStatus = 'boarding' | 'closed' | 'delayed' | 'scheduled';
export type CrowdLevel = 'low' | 'normal' | 'high';

export interface FerryDeparture {
  id: string;
  destination: string;
  departureTime: string; // HH:mm
  port: 'Zadar Port' | 'Gaženica';
  status: BoardingStatus;
  type: 'ferry' | 'catamaran';
}

export interface BusLine {
  id: string;
  lineNumber: string;
  route: string;
  nextDepartures: string[]; // HH:mm
  crowdLevel: CrowdLevel;
  nearestStop: string;
}

export interface IntercityDeparture {
  id: string;
  destination: string;
  departureTime: string;
  carrier: string;
  platform?: string;
}

function getMinutesUntil(timeStr: string): number {
  const now = new Date();
  const [h, m] = timeStr.split(':').map(Number);
  const target = new Date();
  target.setHours(h, m, 0, 0);
  if (target < now) target.setDate(target.getDate() + 1);
  return Math.round((target.getTime() - now.getTime()) / 60000);
}

export function getTimeRemaining(timeStr: string): string {
  const mins = getMinutesUntil(timeStr);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

export function isNextDeparture(timeStr: string): boolean {
  return getMinutesUntil(timeStr) > 0 && getMinutesUntil(timeStr) < 120;
}

// Generate realistic departures based on current time
function generateFerrySchedule(): FerryDeparture[] {
  const now = new Date();
  const h = now.getHours();

  const baseSchedule: Omit<FerryDeparture, 'status'>[] = [
    { id: 'f1', destination: 'Preko', departureTime: '06:00', port: 'Zadar Port', type: 'ferry' },
    { id: 'f2', destination: 'Preko', departureTime: '07:30', port: 'Zadar Port', type: 'ferry' },
    { id: 'f3', destination: 'Ugljan', departureTime: '08:15', port: 'Zadar Port', type: 'ferry' },
    { id: 'f4', destination: 'Preko', departureTime: '09:00', port: 'Zadar Port', type: 'ferry' },
    { id: 'f5', destination: 'Ošljak', departureTime: '09:45', port: 'Zadar Port', type: 'catamaran' },
    { id: 'f6', destination: 'Preko', departureTime: '10:30', port: 'Zadar Port', type: 'ferry' },
    { id: 'f7', destination: 'Dugi Otok', departureTime: '11:00', port: 'Gaženica', type: 'catamaran' },
    { id: 'f8', destination: 'Preko', departureTime: '12:15', port: 'Zadar Port', type: 'ferry' },
    { id: 'f9', destination: 'Iž', departureTime: '13:00', port: 'Gaženica', type: 'ferry' },
    { id: 'f10', destination: 'Preko', departureTime: '14:00', port: 'Zadar Port', type: 'ferry' },
    { id: 'f11', destination: 'Silba', departureTime: '14:30', port: 'Gaženica', type: 'catamaran' },
    { id: 'f12', destination: 'Preko', departureTime: '15:30', port: 'Zadar Port', type: 'ferry' },
    { id: 'f13', destination: 'Ugljan', departureTime: '16:15', port: 'Zadar Port', type: 'ferry' },
    { id: 'f14', destination: 'Preko', departureTime: '17:00', port: 'Zadar Port', type: 'ferry' },
    { id: 'f15', destination: 'Dugi Otok', departureTime: '17:30', port: 'Gaženica', type: 'catamaran' },
    { id: 'f16', destination: 'Preko', departureTime: '18:30', port: 'Zadar Port', type: 'ferry' },
    { id: 'f17', destination: 'Preko', departureTime: '20:00', port: 'Zadar Port', type: 'ferry' },
    { id: 'f18', destination: 'Preko', departureTime: '21:30', port: 'Zadar Port', type: 'ferry' },
  ];

  return baseSchedule.map(d => {
    const mins = getMinutesUntil(d.departureTime);
    let status: BoardingStatus = 'scheduled';
    if (mins <= 0) status = 'closed';
    else if (mins <= 15) status = 'boarding';
    else if (d.id === 'f9') status = 'delayed'; // simulate one delay
    return { ...d, status };
  });
}

export const ferryDepartures = generateFerrySchedule();

export const cityBusLines: BusLine[] = [
  { id: 'b1', lineNumber: '1', route: 'Poluotok — Borik', nextDepartures: ['06:15', '06:45', '07:15', '07:45', '08:15', '08:45', '09:15', '10:00', '10:45', '11:30', '12:15', '13:00', '13:45', '14:30', '15:15', '16:00', '16:45', '17:30', '18:15', '19:00', '20:00', '21:00'], crowdLevel: 'normal', nearestStop: 'Forum' },
  { id: 'b2', lineNumber: '2', route: 'Poluotok — Diklo', nextDepartures: ['06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:45', '10:30', '11:15', '12:00', '12:45', '13:30', '14:15', '15:00', '15:45', '16:30', '17:15', '18:00', '19:00', '20:00', '21:00'], crowdLevel: 'low', nearestStop: 'Narodni trg' },
  { id: 'b3', lineNumber: '3', route: 'Poluotok — Bili Brig', nextDepartures: ['06:20', '07:00', '07:40', '08:20', '09:00', '09:45', '10:30', '11:15', '12:00', '12:45', '13:30', '14:15', '15:00', '15:45', '16:30', '17:15', '18:00', '19:00', '20:00'], crowdLevel: 'high', nearestStop: 'Jazine' },
  { id: 'b4', lineNumber: '4', route: 'Poluotok — Gaženica', nextDepartures: ['06:00', '06:40', '07:20', '08:00', '08:40', '09:20', '10:00', '10:45', '11:30', '12:15', '13:00', '13:45', '14:30', '15:15', '16:00', '16:45', '17:30', '18:15', '19:00', '20:00', '21:00'], crowdLevel: 'normal', nearestStop: 'Autobusni kolodvor' },
  { id: 'b5', lineNumber: '5', route: 'Poluotok — Crno', nextDepartures: ['07:00', '08:00', '09:00', '10:00', '11:30', '13:00', '14:30', '16:00', '17:30', '19:00', '20:30'], crowdLevel: 'low', nearestStop: 'Forum' },
  { id: 'b6', lineNumber: '6', route: 'Poluotok — Arbanasi', nextDepartures: ['06:30', '07:15', '08:00', '08:45', '09:30', '10:15', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'], crowdLevel: 'normal', nearestStop: 'Varoš' },
];

export const intercityDepartures: IntercityDeparture[] = [
  { id: 'ic1', destination: 'Zagreb', departureTime: '06:00', carrier: 'Croatia Bus', platform: '3' },
  { id: 'ic2', destination: 'Zagreb', departureTime: '08:30', carrier: 'Autotrans', platform: '5' },
  { id: 'ic3', destination: 'Split', departureTime: '07:00', carrier: 'Croatia Bus', platform: '2' },
  { id: 'ic4', destination: 'Split', departureTime: '10:00', carrier: 'Autotrans', platform: '4' },
  { id: 'ic5', destination: 'Split', departureTime: '14:00', carrier: 'Croatia Bus', platform: '2' },
  { id: 'ic6', destination: 'Šibenik', departureTime: '07:30', carrier: 'Autotrans', platform: '1' },
  { id: 'ic7', destination: 'Šibenik', departureTime: '12:00', carrier: 'Croatia Bus', platform: '1' },
  { id: 'ic8', destination: 'Šibenik', departureTime: '16:30', carrier: 'Autotrans', platform: '1' },
  { id: 'ic9', destination: 'Rijeka', departureTime: '09:00', carrier: 'Autotrans', platform: '6' },
  { id: 'ic10', destination: 'Rijeka', departureTime: '15:00', carrier: 'Croatia Bus', platform: '6' },
  { id: 'ic11', destination: 'Dubrovnik', departureTime: '08:00', carrier: 'Croatia Bus', platform: '7' },
  { id: 'ic12', destination: 'Dubrovnik', departureTime: '16:00', carrier: 'Autotrans', platform: '7' },
  { id: 'ic13', destination: 'Zagreb', departureTime: '12:00', carrier: 'Croatia Bus', platform: '3' },
  { id: 'ic14', destination: 'Zagreb', departureTime: '16:00', carrier: 'Autotrans', platform: '5' },
  { id: 'ic15', destination: 'Zagreb', departureTime: '20:00', carrier: 'Croatia Bus', platform: '3' },
];

// Get next upcoming ferry (for widget)
export function getNextFerry(): FerryDeparture | null {
  return ferryDepartures.find(d => d.status === 'boarding' || d.status === 'scheduled') || null;
}

// Get next bus for a line
export function getNextBusDepartures(lineId: string, count = 3): string[] {
  const line = cityBusLines.find(l => l.id === lineId);
  if (!line) return [];
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  return line.nextDepartures
    .filter(t => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m > nowMins;
    })
    .slice(0, count);
}
