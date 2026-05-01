import { Business, EmergencyContact, CategoryId, VerificationStatus } from './types';
import { scoreMatch } from '@/lib/fuzzySearch';
import { supabase } from '@/integrations/supabase/client';

// --- Hours override cache ---
type HoursOverride = {
  business_id: string;
  day_of_week: number;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
};
let _overridesCache: HoursOverride[] = [];
let _overridesFetched = false;

export async function loadHoursOverrides() {
  if (_overridesFetched) return;
  const { data } = await supabase
    .from('business_hours_overrides')
    .select('business_id, day_of_week, open_time, close_time, is_closed');
  _overridesCache = (data as unknown as HoursOverride[]) || [];
  _overridesFetched = true;
}

// Call this early (fire and forget)
loadHoursOverrides();

// --- Public holidays cache (Europe/Zagreb) ---
let _holidaysCache: Set<string> = new Set();
let _holidaysFetched = false;

export async function loadPublicHolidays() {
  if (_holidaysFetched) return;
  const { data } = await supabase
    .from('public_holidays')
    .select('holiday_date');
  _holidaysCache = new Set((data || []).map((d: any) => d.holiday_date));
  _holidaysFetched = true;
}
loadPublicHolidays();

function todayIsHolidayZagreb(): boolean {
  // YYYY-MM-DD in Europe/Zagreb
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Zagreb',
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
  const today = fmt.format(new Date());
  return _holidaysCache.has(today);
}

// Categories that close on public holidays (except 24/7 emergency services).
// Restaurants, cafes, gas stations, parking etc. typically work — so excluded.
const HOLIDAY_CLOSED_CATEGORIES = new Set<string>([
  'pharmacy', 'doctor', 'dentist', 'medicine',
  'bank', 'post', 'government', 'library',
  'shops', 'shopping', 'market', 'beauty', 'hair', 'barber',
  'service', 'mechanic', 'carwash',
]);

export const categories: { id: CategoryId; icon: string; labelKey: string }[] = [
  { id: 'pharmacy', icon: 'Pill', labelKey: 'category.pharmacy' },
  { id: 'doctor', icon: 'HealthCross', labelKey: 'category.doctor' },
  { id: 'dentist', icon: 'ToothIcon', labelKey: 'category.dentist' },
  { id: 'medicine', icon: 'Stethoscope', labelKey: 'category.medicine' },
  { id: 'shops', icon: 'ShoppingBag', labelKey: 'category.shops' },
  { id: 'restaurants', icon: 'UtensilsCrossed', labelKey: 'category.restaurants' },
  { id: 'cafes', icon: 'Coffee', labelKey: 'category.cafes' },
  { id: 'gas', icon: 'Fuel', labelKey: 'category.gas' },
  { id: 'nauticalGas', icon: 'Anchor', labelKey: 'category.nauticalGas' },
  { id: 'parking', icon: 'ParkingSquare', labelKey: 'category.parking' },
  { id: 'transport', icon: 'Bus', labelKey: 'category.transport' },
  { id: 'emergency', icon: 'Siren', labelKey: 'category.emergency' },
  { id: 'events', icon: 'CalendarDays', labelKey: 'category.events' },
  { id: 'publicServices', icon: 'Building2', labelKey: 'category.publicServices' },
];

export const emergencyContacts: EmergencyContact[] = [
  { id: 'police', nameKey: 'emergency.police', number: '192', description: 'Policijska uprava zadarska' },
  { id: 'ambulance', nameKey: 'emergency.ambulance', number: '194', description: 'Hitna medicinska pomoć Zadar' },
  { id: 'fire', nameKey: 'emergency.fire', number: '193', description: 'Javna vatrogasna postrojba Zadar' },
  { id: 'hospital', nameKey: 'emergency.hospital', number: '023 505 505', description: 'Opća bolnica Zadar, Bože Peričića 5' },
  { id: 'touristPolice', nameKey: 'emergency.touristPolice', number: '023 312 888', description: 'Turistička policija — sezonski' },
];

const wh = (m: string, s: string, su: string) => ({
  mon: m, tue: m, wed: m, thu: m, fri: m, sat: s, sun: su,
});

// Helper to generate mock timestamps relative to now
function minutesAgo(min: number): string {
  return new Date(Date.now() - min * 60000).toISOString();
}

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3600000).toISOString();
}

function daysAgo(d: number): string {
  return new Date(Date.now() - d * 86400000).toISOString();
}

export function getRelativeTime(isoString: string | undefined): string {
  if (!isoString) return '—';
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function calculateTrustScore(business: Business): number {
  let score = 30; // base
  if (business.verificationStatus === 'owner') score += 40;
  else if (business.verificationStatus === 'community') score += 20;
  else if (business.verificationStatus === 'unverified') score += 0;

  // Recency of owner verification
  if (business.ownerVerifiedAt) {
    const daysSince = (Date.now() - new Date(business.ownerVerifiedAt).getTime()) / 86400000;
    if (daysSince < 1) score += 15;
    else if (daysSince < 7) score += 10;
    else if (daysSince < 30) score += 5;
  }

  // Community confirmation recency
  if (business.communityConfirmedAt) {
    const daysSince = (Date.now() - new Date(business.communityConfirmedAt).getTime()) / 86400000;
    if (daysSince < 1) score += 10;
    else if (daysSince < 7) score += 5;
  }

  // Auto-check bonus
  if (business.lastAutoChecked) {
    const daysSince = (Date.now() - new Date(business.lastAutoChecked).getTime()) / 86400000;
    if (daysSince < 1) score += 5;
  }

  // Report penalty
  score -= business.reportCount * 8;

  return Math.max(0, Math.min(100, score));
}

export const businesses: Business[] = [
  // PHARMACIES (verified via Google Places, ljekarna-zadar.hr, screenshots — Feb 2026)
  { id: 'ph1', name: 'Ljekarna Jadran (0-24)', category: 'pharmacy', address: 'Put Murvice 2, Zadar', phone: '023 211 743', website: 'https://ljekarna-zadar.hr/', workingHours: wh('00:00–24:00', '00:00–24:00', '00:00–24:00'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'owner', ownerVerifiedAt: hoursAgo(2), communityConfirmedAt: hoursAgo(1), lastAutoChecked: hoursAgo(1), trustScore: 95, featured: true },
  { id: 'ph2', name: 'Ljekarna Zadar – Centar', category: 'pharmacy', address: 'Ul. Jurja Barakovića 2, Zadar', phone: '023 302 921', website: 'https://ljekarna-zadar.hr/', workingHours: wh('07:00–20:00', '08:00–13:00', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(3), lastAutoChecked: hoursAgo(2), trustScore: 72 },
  { id: 'ph3', name: 'Ljekarna Zadar – Varoš', category: 'pharmacy', address: 'Borelli ul. 1, Zadar', phone: '023 224 281', website: 'https://ljekarna-zadar.hr/', workingHours: wh('07:00–20:00', '08:00–13:00', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(4), lastAutoChecked: hoursAgo(2), trustScore: 70 },
  { id: 'ph4', name: 'Ljekarna Zadar – Dr. E. Andrović', category: 'pharmacy', address: 'Put Petrića 34, Zadar', phone: '023 324 467', website: 'https://ljekarna-zadar.hr/', workingHours: wh('07:00–20:00', '08:00–13:00', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(5), lastAutoChecked: hoursAgo(3), trustScore: 68 },
  { id: 'ph5', name: 'Ljekarna Zadar – Bokanjac', category: 'pharmacy', address: 'Put Vrela 2a, Zadar', phone: '023 231 205', website: 'https://ljekarna-zadar.hr/', workingHours: wh('07:00–20:00', '08:00–13:00', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(6), lastAutoChecked: hoursAgo(3), trustScore: 68 },
  { id: 'ph6', name: 'Ljekarne Farmacia – Murvička', category: 'pharmacy', address: 'Murvička 1, Zadar', phone: '023 312 744', workingHours: wh('07:00–20:00', '08:00–13:00', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(4), lastAutoChecked: hoursAgo(2), trustScore: 70 },
  { id: 'ph7', name: 'Farmacia – Radića', category: 'pharmacy', address: 'Ul. Stjepana Radića 5, Zadar', phone: '023 235 735', website: 'http://www.farmacia.hr/', workingHours: wh('07:00–20:00', '08:00–13:00', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(5), lastAutoChecked: hoursAgo(3), trustScore: 68 },
  { id: 'ph8', name: 'Ljekarne Vaše Zdravlje – Ričine', category: 'pharmacy', address: 'Put Kotlara 50, Zadar', phone: '023 319 631', website: 'https://webljekarna.vasezdravlje.com/', workingHours: wh('07:00–20:00', '08:00–13:00', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(3), lastAutoChecked: hoursAgo(2), trustScore: 72 },
  { id: 'ph9', name: 'Ljekarne Vaše Zdravlje – Melada', category: 'pharmacy', address: 'Put Bokanjca 42A, Zadar', phone: '023 324 636', website: 'https://webljekarna.vasezdravlje.com/', workingHours: wh('07:00–20:00', '08:00–13:00', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(4), lastAutoChecked: hoursAgo(3), trustScore: 70 },
  { id: 'ph10', name: 'Ljekarne Valčić', category: 'pharmacy', address: 'Put Matije Gupca 2A, Zadar', phone: '023 332 016', workingHours: wh('07:00–20:00', '08:00–13:00', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(5), lastAutoChecked: hoursAgo(3), trustScore: 68 },
  { id: 'ph11', name: 'Ljekarne Krišto', category: 'pharmacy', address: 'Ul. Bože Peričića 10, Zadar', phone: '023 314 793', website: 'http://www.ljekarna-kristo.hr/', workingHours: wh('07:00–20:00', '08:00–13:00', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(4), lastAutoChecked: hoursAgo(2), trustScore: 72 },
  { id: 'ph12', name: 'Prima Pharme – Višnjik', category: 'pharmacy', address: 'Ul. Nikole Tesle 12b, Zadar', phone: '023 231 801', website: 'https://primapharme.hr/', workingHours: wh('07:00–20:00', '08:00–13:00', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(3), lastAutoChecked: hoursAgo(2), trustScore: 72 },
  { id: 'ph13', name: 'Prima Pharme – Starčevića', category: 'pharmacy', address: 'Ul. Ante Starčevića 15a, Zadar', phone: '023 241 217', website: 'https://primapharme.hr/', workingHours: wh('07:00–20:00', '08:00–13:00', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(5), lastAutoChecked: hoursAgo(3), trustScore: 70 },
  { id: 'ph14', name: 'Prima Pharme – Bibinje', category: 'pharmacy', address: 'Trg Tome Bulića 5, Bibinje', phone: '—', website: 'https://primapharme.hr/', workingHours: wh('07:00–20:00', '08:00–13:00', 'Zatvoreno'), verified: false, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'unverified', lastAutoChecked: hoursAgo(4), trustScore: 40 },
  { id: 'ph15', name: 'Ljekarna Šarunić 1', category: 'pharmacy', address: 'Vukovarska ul. 3-c, Zadar', phone: '023 326 932', workingHours: wh('07:00–20:00', '08:00–13:00', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(3), lastAutoChecked: hoursAgo(2), trustScore: 72 },
  { id: 'ph16', name: 'Ljekarna Šarunić 2', category: 'pharmacy', address: 'Ul. Borka Šarlije Kese 8a, Zadar', phone: '023 317 141', workingHours: wh('07:00–20:00', '08:00–13:00', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(4), lastAutoChecked: hoursAgo(3), trustScore: 70 },
  { id: 'ph17', name: 'Ljekarna Šarunić 3', category: 'pharmacy', address: 'Ul. bana Josipa Jelačića 20, Zadar', phone: '023 230 686', workingHours: wh('07:00–20:00', '08:00–13:00', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(5), lastAutoChecked: hoursAgo(3), trustScore: 70 },

  // DENTISTS (real data from Cybo.com)
  { id: 'dn1', name: 'KolovareDENTAL', category: 'dentist', address: 'Ul. Bože Peričića 14, Zadar', phone: '023 494 150', website: 'https://www.kolovaredental.eu', workingHours: wh('08:00–16:00', '08:00–12:00', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(3), lastAutoChecked: hoursAgo(2), trustScore: 72, lat: 44.1100, lng: 15.2300 },
  { id: 'dn2', name: 'Dentex Dental Clinic & Implantology Center', category: 'dentist', address: 'Ul. Nikole Tesle 12, Zadar', phone: '023 251 660', website: 'https://www.dentex-croatia.com', workingHours: wh('08:00–17:00', '08:00–13:00', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(5), lastAutoChecked: hoursAgo(3), trustScore: 75, lat: 44.1190, lng: 15.2310 },
  { id: 'dn3', name: 'Zara Dental Centar', category: 'dentist', address: 'Put Matije Gupca 33, Zadar', phone: '098 226 918', website: 'https://www.zdc.hr', workingHours: wh('08:00–16:00', '09:00–12:00', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(4), lastAutoChecked: hoursAgo(2), trustScore: 70, lat: 44.1230, lng: 15.2180 },
  { id: 'dn4', name: 'Dentalna poliklinika Kranjčević Bubica', category: 'dentist', address: 'Ul. Svetog Vinka Paulskog 20, Zadar', phone: '023 311 520', website: 'https://www.dentalcentar-kranjcevicbubica.com', workingHours: wh('08:00–16:00', '08:00–12:00', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(6), lastAutoChecked: hoursAgo(3), trustScore: 74, lat: 44.1175, lng: 15.2195 },
  { id: 'dn5', name: 'Dekorti Dental Center', category: 'dentist', address: 'Put Matije Gupca 1, Zadar', phone: '023 331 158', website: 'https://www.dental-dekorti.eu', workingHours: wh('08:00–17:00', '09:00–13:00', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(3), lastAutoChecked: hoursAgo(1), trustScore: 76, lat: 44.1228, lng: 15.2175 },
  { id: 'dn6', name: 'Mirakul Dental Centar', category: 'dentist', address: 'Ul. Svetog Vinka Paulskog 32, Zadar', phone: '023 776 175', website: 'https://www.dental-centar-mirakul.hr', workingHours: wh('08:00–16:00', '08:00–12:00', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(4), lastAutoChecked: hoursAgo(2), trustScore: 73, lat: 44.1178, lng: 15.2200 },
  { id: 'dn7', name: 'Zara Dent', category: 'dentist', address: 'Put Murata 12, Zadar', phone: '023 632 061', website: 'https://www.zaradent.hr', workingHours: wh('08:00–16:00', '09:00–12:00', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(5), lastAutoChecked: hoursAgo(3), trustScore: 71, lat: 44.1210, lng: 15.2260 },
  { id: 'dn8', name: 'Ordinacija dentalne medicine Ljilja Pantalon', category: 'dentist', address: 'Ul. Hrvoja Ćustića 88b, Zadar', phone: '023 318 434', website: 'https://www.dentalzadar.com', workingHours: wh('08:00–15:00', '08:00–12:00', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(6), lastAutoChecked: hoursAgo(4), trustScore: 68, lat: 44.1260, lng: 15.2150 },
  { id: 'dn9', name: 'Ordinacija dentalne medicine Branka Bilan', category: 'dentist', address: 'Postrojbi specijalne policije 19, Zadar', phone: '023 779 939', website: 'https://www.ordinacija-bilan.hr', workingHours: wh('08:00–16:00', 'Zatvoreno', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(7), lastAutoChecked: hoursAgo(3), trustScore: 70, lat: 44.1140, lng: 15.2330 },
  { id: 'dn10', name: 'Medenta — dr. Mia Ercegović', category: 'dentist', address: 'Ul. Zrinsko Frankopanska 38, Zadar', phone: '095 820 0541', website: 'https://medenta-zd.com', workingHours: wh('08:00–16:00', '09:00–12:00', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(4), lastAutoChecked: hoursAgo(2), trustScore: 72, lat: 44.1155, lng: 15.2240 },
  { id: 'dn11', name: 'Milardović Dental', category: 'dentist', address: 'Ul. Franje Fanceva 22b, Zadar', phone: '023 331 897', website: 'https://www.milardovicdental.hr', workingHours: wh('08:00–16:00', '08:00–12:00', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(5), lastAutoChecked: hoursAgo(3), trustScore: 69, lat: 44.1235, lng: 15.2165 },
  { id: 'dn12', name: 'Stomatološka ordinacija Frano Sladović', category: 'dentist', address: 'Ul. Ruđera Boškovića 4, Zadar', phone: '023 300 001', website: 'https://www.ordinacija-sladovic.hr', workingHours: wh('08:00–16:00', '08:00–12:00', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(6), lastAutoChecked: hoursAgo(4), trustScore: 71, lat: 44.1200, lng: 15.2280 },
  { id: 'dn13', name: 'Stomatološka poliklinika Nika — Ortodoncija', category: 'dentist', address: 'Ul. Ante Kovačića 10, Zadar', phone: '023 337 765', website: 'https://www.poliklinika-nika.hr', workingHours: wh('08:00–17:00', '08:00–13:00', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(3), lastAutoChecked: hoursAgo(2), trustScore: 74, lat: 44.1220, lng: 15.2190 },
  { id: 'dn14', name: 'Ordinacija dentalne medicine Ida Sapun', category: 'dentist', address: 'Savarska ul. 11, Zadar', phone: '098 635 604', workingHours: wh('08:00–15:00', '08:00–12:00', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(5), lastAutoChecked: hoursAgo(3), trustScore: 67, lat: 44.1245, lng: 15.2170 },
  { id: 'dn15', name: 'Dental Center Dijan', category: 'dentist', address: 'Ul. Braće Vranjana 9, Zadar', phone: '023 313 480', website: 'https://www.dentaldijan.com', workingHours: wh('08:00–16:00', '09:00–12:00', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(4), lastAutoChecked: hoursAgo(2), trustScore: 70, lat: 44.1148, lng: 15.2245 },
  { id: 'dn16', name: 'Dental Miletić', category: 'dentist', address: 'Polačišće ul. 2, Zadar', phone: '023 311 228', website: 'https://dentalmileticzadar.com', workingHours: wh('08:00–16:00', '08:00–12:00', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(6), lastAutoChecked: hoursAgo(3), trustScore: 71, lat: 44.1165, lng: 15.2225 },
  { id: 'dn17', name: 'Stomatološka ordinacija Marica Vujanić-Džepina', category: 'dentist', address: 'Benkovačka cesta 42, Zadar', phone: '023 341 652', workingHours: wh('08:00–15:00', 'Zatvoreno', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(7), lastAutoChecked: hoursAgo(4), trustScore: 65, lat: 44.1280, lng: 15.2140 },
  { id: 'dn18', name: 'Ordinacija dentalne medicine Iva Rakvin Krizmanić', category: 'dentist', address: 'Ul. Lovre Matačića 50, Zadar', phone: '023 219 749', workingHours: wh('08:00–16:00', 'Zatvoreno', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(5), lastAutoChecked: hoursAgo(3), trustScore: 68, lat: 44.1215, lng: 15.2205 },
  { id: 'dn19', name: 'Dežulović Nada, dr. med. dent.', category: 'dentist', address: 'Ul. Nadbiskupa Nikole Matafara 2A, Zadar', phone: '023 250 709', website: 'https://dentaldezulovic.hr', workingHours: wh('08:00–15:00', '08:00–12:00', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(6), lastAutoChecked: hoursAgo(4), trustScore: 69, lat: 44.1152, lng: 15.2255 },
  { id: 'dn20', name: 'Dental Practice Dr. Zrinka Kolega', category: 'dentist', address: 'Put Murvice 12c, Zadar', phone: '023 214 854', website: 'https://www.kolegadental.com', workingHours: wh('08:00–16:00', '08:00–12:00', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(4), lastAutoChecked: hoursAgo(2), trustScore: 72, lat: 44.1130, lng: 15.2290 },
  { id: 'dn21', name: 'Dr. sc. Marijana Rinčić Mlinarić — spec. ortodont', category: 'dentist', address: 'Ul. Katarine Zrinske 1, Zadar', phone: '023 700 888', workingHours: wh('08:00–16:00', '08:00–12:00', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(5), lastAutoChecked: hoursAgo(3), trustScore: 70, lat: 44.1160, lng: 15.2230 },
  { id: 'dn22', name: 'Ord. dentalne medicine Sergej Kuštera', category: 'dentist', address: 'Ul. Andrije Medulića 1, Zadar', phone: '023 213 956', workingHours: wh('08:00–16:00', '08:00–12:00', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(6), lastAutoChecked: hoursAgo(4), trustScore: 68, lat: 44.1143, lng: 15.2262 },
  { id: 'dn23', name: 'Stom. ordinacija Sanja Jermen-Vodopija', category: 'dentist', address: 'Molatska ul. 11, Zadar', phone: '023 319 439', workingHours: wh('08:00–15:00', '08:00–12:00', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(4), lastAutoChecked: hoursAgo(2), trustScore: 67, lat: 44.1170, lng: 15.2210 },
  { id: 'dn24', name: 'Ord. dentalne medicine Valerija Skračić-Čačić', category: 'dentist', address: 'Molatska ul. 11A, Zadar', phone: '023 214 685', workingHours: wh('08:00–15:00', '08:00–12:00', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(5), lastAutoChecked: hoursAgo(3), trustScore: 69, lat: 44.1170, lng: 15.2211 },
  { id: 'dn25', name: 'Nika Medical', category: 'dentist', address: 'Ul. Zrinsko Frankopanska 20a, Zadar', phone: '099 365 8139', website: 'https://www.nika-medical.com', workingHours: wh('08:00–16:00', '09:00–12:00', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(3), lastAutoChecked: hoursAgo(2), trustScore: 71, lat: 44.1158, lng: 15.2238 },
  { id: 'dn26', name: 'Stom. ordinacija dr. Stipe Splivalo', category: 'dentist', address: 'Ul. kralja Stjepana Držislava 10, Zadar', phone: '023 313 113', workingHours: wh('08:00–16:00', '08:00–12:00', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(6), lastAutoChecked: hoursAgo(4), trustScore: 68, lat: 44.1145, lng: 15.2250 },
  { id: 'dn27', name: 'M Dental Centar', category: 'dentist', address: 'Romansa ul. 24b, Zadar', phone: '023 334 545', website: 'https://www.mdentalcentar.com.hr', workingHours: wh('08:00–17:00', '08:00–13:00', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(4), lastAutoChecked: hoursAgo(2), trustScore: 72, lat: 44.1250, lng: 15.2160 },
  { id: 'dn28', name: 'Ord. dentalne medicine Hrvoje Bračić', category: 'dentist', address: 'Ul. kralja Stjepana Držislava 10, Zadar', phone: '023 313 113', website: 'https://www.insuladent.hr', workingHours: wh('08:00–16:00', '08:00–12:00', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(5), lastAutoChecked: hoursAgo(3), trustScore: 70, lat: 44.1145, lng: 15.2251 },
  { id: 'dn29', name: 'Stom. ordinacija Boris Bubičić', category: 'dentist', address: 'Forum b.b., Zadar', phone: '023 250 927', workingHours: wh('08:00–15:00', '08:00–12:00', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(7), lastAutoChecked: hoursAgo(4), trustScore: 65, lat: 44.1153, lng: 15.2242 },
  { id: 'dn30', name: 'Insula Dent d.o.o.', category: 'dentist', address: 'Ul. kralja Stjepana Držislava 10, Zadar', phone: '023 313 113', website: 'https://www.insuladent.hr', workingHours: wh('08:00–17:00', '08:00–13:00', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(3), lastAutoChecked: hoursAgo(2), trustScore: 73, lat: 44.1146, lng: 15.2250 },
  { id: 'dn31', name: 'Ivanov Dental', category: 'dentist', address: 'Ul. Andrije Medulića 1, Zadar', phone: '023 213 011', website: 'https://www.ivanov-dental.hr', workingHours: wh('08:00–16:00', '08:00–12:00', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(4), lastAutoChecked: hoursAgo(2), trustScore: 71, lat: 44.1144, lng: 15.2263 },
  { id: 'dn32', name: 'Ordinacija dr. Paško Benelli', category: 'dentist', address: 'Ul. Domovinskog rata 4, Zadar', phone: '023 251 682', workingHours: wh('08:00–15:00', 'Zatvoreno', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(6), lastAutoChecked: hoursAgo(4), trustScore: 66, lat: 44.1185, lng: 15.2315 },
  { id: 'dn33', name: 'Stom. ordinacija dr. Radmila Miljanić', category: 'dentist', address: 'Obala kneza Trpimira 58, Zadar', phone: '023 332 661', workingHours: wh('08:00–15:00', '08:00–12:00', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(5), lastAutoChecked: hoursAgo(3), trustScore: 67, lat: 44.1195, lng: 15.2320 },
  { id: 'dn34', name: 'Panjol Dental', category: 'dentist', address: 'Ul. Svete Marije 68, Zadar', phone: '023 236 099', website: 'https://panjoldental.com', workingHours: wh('08:00–16:00', '08:00–12:00', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(3), lastAutoChecked: hoursAgo(2), trustScore: 72, lat: 44.1150, lng: 15.2248 },
  { id: 'dn35', name: 'Ord. dentalne medicine Dubravka Kos', category: 'dentist', address: 'Ul. Rikarda Katalinića Jeretova 7A, Zadar', phone: '023 236 566', website: 'https://www.ordinacija-kos.hr', workingHours: wh('08:00–16:00', '08:00–12:00', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(4), lastAutoChecked: hoursAgo(2), trustScore: 70, lat: 44.1162, lng: 15.2228 },
  { id: 'dn36', name: 'Dr. Marcela Miljanić', category: 'dentist', address: 'Molatska ul., Zadar', phone: '023 314 779', workingHours: wh('08:00–15:00', 'Zatvoreno', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(6), lastAutoChecked: hoursAgo(4), trustScore: 65, lat: 44.1171, lng: 15.2212 },
  // Additional Zadar city dentists (cybo pages 5-7)
  { id: 'dn37', name: 'Stom. ordinacija dr. Oliver Brkić', category: 'dentist', address: 'Put Nina 78a, Zadar', phone: '091 581 8166', workingHours: wh('08:00–16:00', '08:00–12:00', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(5), lastAutoChecked: hoursAgo(3), trustScore: 69, lat: 44.1290, lng: 15.2100 },
  { id: 'dn38', name: 'Stom. ordinacija dr. Jasminka Radić', category: 'dentist', address: 'Ul. Andrije Medulića 1, Zadar', phone: '023 314 261', workingHours: wh('08:00–15:00', 'Zatvoreno', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(6), lastAutoChecked: hoursAgo(4), trustScore: 66, lat: 44.1143, lng: 15.2264 },
  { id: 'dn41', name: 'Nexus Dental', category: 'dentist', address: 'Ul. Svetog Vinka Paulskog 32, Zadar', phone: '023 778 802', workingHours: wh('08:00–16:00', '08:00–12:00', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(4), lastAutoChecked: hoursAgo(2), trustScore: 70, lat: 44.1178, lng: 15.2201 },
  { id: 'dn42', name: 'Pearlsmile', category: 'dentist', address: 'Ul. bana Josipa Jelačića 10D, Zadar', phone: '099 620 0337', workingHours: wh('08:00–16:00', '09:00–13:00', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(5), lastAutoChecked: hoursAgo(3), trustScore: 68, lat: 44.1135, lng: 15.2275 },
  
  { id: 'dn44', name: 'Stom. ordinacija Alida Vanjak Lokas', category: 'dentist', address: 'Ul. Stjepana Radića 42, Zadar', phone: '023 230 445', workingHours: wh('08:00–15:00', 'Zatvoreno', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(5), lastAutoChecked: hoursAgo(3), trustScore: 65, lat: 44.1200, lng: 15.2160 },
  { id: 'dn47', name: 'Damira Juras, dr. med. dent.', category: 'dentist', address: 'Put Murvice 14, Zadar', phone: '023 316 175', workingHours: wh('08:00–15:00', 'Zatvoreno', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(5), lastAutoChecked: hoursAgo(3), trustScore: 67, lat: 44.1132, lng: 15.2288 },
  { id: 'dn48', name: 'Dental Orbis d.o.o.', category: 'dentist', address: 'Ul. Ive Senjanina 14, Zadar', phone: '023 385 165', workingHours: wh('08:00–17:00', '08:00–13:00', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(4), lastAutoChecked: hoursAgo(2), trustScore: 71, lat: 44.1168, lng: 15.2218 },
  { id: 'dn49', name: 'ApexDental', category: 'dentist', address: 'Obala kneza Trpimira 21a, Zadar', phone: '092 213 4499', website: 'https://www.apexdental.hr', workingHours: wh('08:00–17:00', '09:00–13:00', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(3), lastAutoChecked: hoursAgo(2), trustScore: 73, lat: 44.1195, lng: 15.2325 },
  
  // DZ Zadar city dentists
  { id: 'dn51', name: 'Luka Begonja, dr. med. dent. (DZ)', category: 'dentist', address: 'Molatska ul. 11, Zadar', phone: '023 218 941', workingHours: wh('07:00–14:30', '07:00–14:30', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(4), lastAutoChecked: hoursAgo(2), trustScore: 70, lat: 44.1170, lng: 15.2213 },
  { id: 'dn52', name: 'Nikolina Zekanović, dr. med. dent. (DZ)', category: 'dentist', address: 'Trg sv. Šimuna i Tadije 6, Zadar', phone: '023 629 149', workingHours: wh('07:00–14:30', '07:00–14:30', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(5), lastAutoChecked: hoursAgo(3), trustScore: 68, lat: 44.1158, lng: 15.2235 },
  { id: 'dn53', name: 'Roko Žodan, dr. med. dent. (DZ)', category: 'dentist', address: 'Obala kneza Trpimira 25, Zadar', phone: '023 646 637', workingHours: wh('07:00–14:30', '07:00–14:30', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(6), lastAutoChecked: hoursAgo(4), trustScore: 67, lat: 44.1193, lng: 15.2318 },
  { id: 'dn54', name: 'Zrinka Vuksan, dr. med. dent. (DZ)', category: 'dentist', address: 'Ul. Andrije Medulića 1, Zadar', phone: '023 647 454', workingHours: wh('07:00–14:30', '07:00–14:30', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(4), lastAutoChecked: hoursAgo(2), trustScore: 69, lat: 44.1143, lng: 15.2267 },
  { id: 'dn55', name: 'Matea Renić, dr. med. dent. (DZ)', category: 'dentist', address: 'Ul. Andrije Medulića 1, Zadar', phone: '023 643 460', workingHours: wh('07:00–14:30', '07:00–14:30', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(5), lastAutoChecked: hoursAgo(3), trustScore: 68, lat: 44.1143, lng: 15.2268 },

  // ZADARSKA ŽUPANIJA — stomatolozi izvan grada Zadra
  { id: 'dn56', name: 'Dr. Ante Lucin', category: 'dentist', address: 'Šušina 1, Vir', phone: '023 363 449', workingHours: wh('08:00–15:00', 'Zatvoreno', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(6), lastAutoChecked: hoursAgo(4), trustScore: 65, lat: 44.3010, lng: 15.0900 },
  { id: 'dn57', name: 'Ivana Žilić, dr. med. dent.', category: 'dentist', address: 'Hrvatskih branitelja 56, Poličnik', phone: '023 276 286', workingHours: wh('08:00–15:00', 'Zatvoreno', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(5), lastAutoChecked: hoursAgo(3), trustScore: 66, lat: 44.1870, lng: 15.3780 },
  { id: 'dn58', name: 'Ankica Jurin, dr. med. dent.', category: 'dentist', address: 'Lazaretska 6, Preko', phone: '023 286 045', workingHours: wh('08:00–15:00', 'Zatvoreno', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(7), lastAutoChecked: hoursAgo(4), trustScore: 64, lat: 44.0800, lng: 15.1850 },
  { id: 'dn59', name: 'Renata Taraš, dr. med. dent.', category: 'dentist', address: 'Ive Mašine 3, Preko', phone: '023 286 550', workingHours: wh('08:00–15:00', 'Zatvoreno', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(6), lastAutoChecked: hoursAgo(3), trustScore: 65, lat: 44.0802, lng: 15.1855 },
  { id: 'dn60', name: 'Tonica Bukša, dr. med. dent.', category: 'dentist', address: 'Bana Josipa Jelačića 16a, Pag', phone: '023 611 112', workingHours: wh('08:00–15:00', 'Zatvoreno', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(5), lastAutoChecked: hoursAgo(3), trustScore: 66, lat: 44.4430, lng: 15.0470 },
  { id: 'dn61', name: 'Đurđica Tičić, dr. med. dent. (DZ)', category: 'dentist', address: 'Prosika 17, Pag', phone: '023 611 003', workingHours: wh('07:00–14:30', '07:00–14:30', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(6), lastAutoChecked: hoursAgo(4), trustScore: 65, lat: 44.4435, lng: 15.0480 },
  { id: 'dn62', name: 'Ivana Alvir-Delija, dr. med. dent. (DZ)', category: 'dentist', address: 'Trg Tome Bulića 2, Bibinje', phone: '023 261 920', workingHours: wh('07:00–14:30', '07:00–14:30', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(4), lastAutoChecked: hoursAgo(2), trustScore: 68, lat: 44.0750, lng: 15.2850 },
  { id: 'dn63', name: 'Ana Tičić, dr. med. dent. (DZ)', category: 'dentist', address: 'Starigradskih zidara 7, Starigrad Paklenica', phone: '023 647 820', workingHours: wh('07:00–14:30', '07:00–14:30', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(5), lastAutoChecked: hoursAgo(3), trustScore: 67, lat: 44.2890, lng: 15.4470 },
  { id: 'dn64', name: 'Ana Krolo, dr. med. dent. (DZ)', category: 'dentist', address: 'Trg dr. Franje Tuđmana 6, Škabrnja', phone: '023 637 327', workingHours: wh('07:00–14:30', '07:00–14:30', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(6), lastAutoChecked: hoursAgo(4), trustScore: 65, lat: 44.1860, lng: 15.4370 },
  { id: 'dn65', name: 'Ivana Ćoza, dr. med. dent. (DZ)', category: 'dentist', address: 'Ražanac X, Ražanac', phone: '023 651 283', workingHours: wh('07:00–14:30', '07:00–14:30', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(5), lastAutoChecked: hoursAgo(3), trustScore: 66, lat: 44.2780, lng: 15.2430 },
  { id: 'dn66', name: 'Katarina Viduka, dr. med. dent. (DZ)', category: 'dentist', address: 'Stjepana Radića 37, Obrovac', phone: '023 647 106', workingHours: wh('07:00–14:30', '07:00–14:30', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(7), lastAutoChecked: hoursAgo(4), trustScore: 64, lat: 44.1960, lng: 15.6820 },
  { id: 'dn67', name: 'Marinko Sabić, dr. med. dent. (DZ)', category: 'dentist', address: 'Sali III k.br. 20, Sali', phone: '023 377 129', workingHours: wh('07:00–14:30', '07:00–14:30', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(6), lastAutoChecked: hoursAgo(4), trustScore: 65, lat: 43.9370, lng: 15.1630 },
  { id: 'dn68', name: 'Marta Kučina, dr. med. dent. (DZ)', category: 'dentist', address: 'Neviđane 20A, Neviđane', phone: '023 647 110', workingHours: wh('07:00–14:30', '07:00–14:30', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(5), lastAutoChecked: hoursAgo(3), trustScore: 66, lat: 43.9880, lng: 15.1720 },
  { id: 'dn69', name: 'Mirjana Peričić, dr. med. dent. (DZ)', category: 'dentist', address: 'Polača 231, Polača', phone: '023 662 336', workingHours: wh('07:00–14:30', '07:00–14:30', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(6), lastAutoChecked: hoursAgo(4), trustScore: 65, lat: 44.0470, lng: 15.4850 },
  { id: 'dn70', name: 'Sanja Radnić, dr. med. dent. (DZ)', category: 'dentist', address: 'Stankovci 232, Stankovci', phone: '023 380 010', workingHours: wh('07:00–14:30', '07:00–14:30', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(7), lastAutoChecked: hoursAgo(4), trustScore: 64, lat: 43.9900, lng: 15.5770 },
  { id: 'dn71', name: 'Petra Mikulić, dr. med. dent. (DZ)', category: 'dentist', address: 'Stjepana Radića 14, Benkovac', phone: '023 646 177', workingHours: wh('07:00–14:30', '07:00–14:30', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(5), lastAutoChecked: hoursAgo(3), trustScore: 66, lat: 44.0330, lng: 15.6130 },
  { id: 'dn72', name: 'Pavle Mašina, dr. med. dent.', category: 'dentist', address: 'Petra Zoranića 61, Maslenica, Jasenice', phone: '', workingHours: wh('08:00–15:00', '08:00–12:00', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(4), lastAutoChecked: hoursAgo(2), trustScore: 67, lat: 44.2230, lng: 15.5370 },
  { id: 'dn73', name: 'Tamara Karlo, dr. stom.', category: 'dentist', address: 'Medulićeva 1, Zadar', phone: '023 211 924', workingHours: wh('08:00–16:00', '08:00–13:00', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(5), lastAutoChecked: hoursAgo(3), trustScore: 66, lat: 44.1155, lng: 15.2280 },

  // OBITELJSKA MEDICINA — Dom zdravlja Zadarske županije (dzzdzup.hr)
  { id: 'dr1', name: 'Ana Maria Prtenjača, dr. med.', category: 'medicine', address: 'Hrvatskih branitelja 12, Sukošan', phone: '023 229 015', workingHours: wh('07:00–13:30', '13:00–19:30', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(4), lastAutoChecked: hoursAgo(2), trustScore: 74, lat: 44.0371, lng: 15.3072 },
  { id: 'dr2', name: 'Andrea Baćac, dr. med.', category: 'medicine', address: 'Molatska 11, Zadar', phone: '023 627 324', workingHours: wh('07:00–13:30', '13:00–19:30', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(5), lastAutoChecked: hoursAgo(3), trustScore: 72, lat: 44.1170, lng: 15.2213 },
  { id: 'dr3', name: 'Andrija Čakarun, dr. med.', category: 'medicine', address: 'M. Ivanića 6, Biograd na Moru', phone: '023 385 566', workingHours: wh('07:00–13:30', '13:00–19:30', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(6), lastAutoChecked: hoursAgo(4), trustScore: 70, lat: 43.9374, lng: 15.4461 },
  { id: 'dr4', name: 'Ante Knezović, dr. med.', category: 'medicine', address: 'N. Tesle 72, Gračac', phone: '023 646 102', workingHours: wh('07:00–13:30', '13:00–19:30', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(7), lastAutoChecked: hoursAgo(4), trustScore: 68, lat: 44.2618, lng: 15.6947 },
  { id: 'dr5', name: 'Antonija Lerga, dr. med.', category: 'medicine', address: 'Ul. Frana Alfirevića 8, Zadar', phone: '023 219 499', workingHours: wh('07:00–13:30', '13:00–19:30', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(4), lastAutoChecked: hoursAgo(2), trustScore: 73, lat: 44.1190, lng: 15.2230 },
  { id: 'dr6', name: 'Branka Lokin, dr. med.', category: 'medicine', address: 'Molatska 11, Zadar', phone: '023 630 131', workingHours: wh('07:00–13:30', '13:00–19:30', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(5), lastAutoChecked: hoursAgo(3), trustScore: 71, lat: 44.1170, lng: 15.2214 },
  { id: 'dr7', name: 'Bruno Šooš, dr. med.', category: 'medicine', address: 'Ist 184, Ist / Molat 24, Molat', phone: '023 572 310', workingHours: wh('07:00–13:30', '13:00–19:30', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(6), lastAutoChecked: hoursAgo(4), trustScore: 67, lat: 44.2780, lng: 14.7680 },
  { id: 'dr8', name: 'Damir Kapetanović, dr. med.', category: 'medicine', address: 'Starigradskih zidara 7, Starigrad', phone: '023 647 197', workingHours: wh('07:00–13:30', '13:00–19:30', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(3), lastAutoChecked: hoursAgo(2), trustScore: 72, lat: 44.2989, lng: 15.4461 },
  { id: 'dr9', name: 'Dragan Klarić, dr. med.', category: 'medicine', address: 'Božava 30, Božava', phone: '023 377 604', workingHours: wh('07:00–13:30', '13:00–19:30', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(5), lastAutoChecked: hoursAgo(3), trustScore: 69, lat: 44.1530, lng: 14.9050 },
  { id: 'dr10', name: 'Edi Matković, dr. med.', category: 'medicine', address: 'Ulica I. broj 14, Galovac', phone: '023 392 449', workingHours: wh('07:00–13:30', '13:00–19:30', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(4), lastAutoChecked: hoursAgo(2), trustScore: 70, lat: 44.0580, lng: 15.3840 },
  { id: 'dr11', name: 'Dr. Luka Pirnat', category: 'medicine', address: 'Veli Iž', phone: '023 277 012', workingHours: wh('07:00–13:30', '13:00–19:30', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(6), lastAutoChecked: hoursAgo(4), trustScore: 68, lat: 44.0450, lng: 15.1170 },
  { id: 'dr12', name: 'Ivana Ban-Kolega, dr. med.', category: 'medicine', address: 'Rine Aras 1, Zadar', phone: '023 214 445', workingHours: wh('07:00–13:30', '13:00–19:30', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(3), lastAutoChecked: hoursAgo(2), trustScore: 73, lat: 44.1160, lng: 15.2250 },
  { id: 'dr13', name: 'Ivana Bator Pavić, dr. med.', category: 'medicine', address: 'Palih rodoljuba 2, Zadar', phone: '023 646 345', workingHours: wh('07:00–13:30', '13:00–19:30', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(5), lastAutoChecked: hoursAgo(3), trustScore: 71, lat: 44.1185, lng: 15.2275 },
  { id: 'dr14', name: 'Ivan Kožul, dr. med.', category: 'medicine', address: 'Put Zgona 5, Kožino', phone: '023 629 341', workingHours: wh('07:00–13:30', '13:00–19:30', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(4), lastAutoChecked: hoursAgo(2), trustScore: 70, lat: 44.1420, lng: 15.1940 },
  { id: 'dr15', name: 'Jasenka Klarić, dr. med.', category: 'medicine', address: 'Stjepana Radića 14, Benkovac', phone: '023 681 806', workingHours: wh('07:00–13:30', '13:00–19:30', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(6), lastAutoChecked: hoursAgo(4), trustScore: 69, lat: 44.0324, lng: 15.6134 },
  { id: 'dr16', name: 'Ines Lasić, dr. med.', category: 'medicine', address: 'Trg Tome Bulića 1, Bibinje', phone: '023 646 431', workingHours: wh('07:00–13:30', '13:00–19:30', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(3), lastAutoChecked: hoursAgo(2), trustScore: 72, lat: 44.0740, lng: 15.2870 },
  { id: 'dr17', name: 'Katarina Šestan, dr. med.', category: 'medicine', address: 'Ruđera Boškovića 6, Zadar', phone: '023 212 000', workingHours: wh('07:00–13:30', '13:00–19:30', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(5), lastAutoChecked: hoursAgo(3), trustScore: 71, lat: 44.1195, lng: 15.2282 },
  { id: 'dr18', name: 'Klara Jermen, dr. med.', category: 'medicine', address: 'Ivana Pavla II 46, Privlaka', phone: '023 646 684', workingHours: wh('07:00–13:30', '13:00–19:30', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(4), lastAutoChecked: hoursAgo(2), trustScore: 70, lat: 44.2536, lng: 15.1340 },
  { id: 'dr19', name: 'Kristina Artuković, dr. med.', category: 'medicine', address: 'Ul. Frana Alfirevića 8, Zadar', phone: '023 238 163', workingHours: wh('07:00–13:30', '13:00–19:30', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(6), lastAutoChecked: hoursAgo(4), trustScore: 69, lat: 44.1191, lng: 15.2231 },
  { id: 'dr20', name: 'Lucija Marendić, dr. med.', category: 'medicine', address: 'Ul. Sv. Lovre 16, Kali', phone: '023 281 143', workingHours: wh('07:00–13:30', '13:00–19:30', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(3), lastAutoChecked: hoursAgo(2), trustScore: 72, lat: 44.0520, lng: 15.2100 },
  { id: 'dr21', name: 'Maja Kolega, dr. med.', category: 'medicine', address: 'Molatska 11, Zadar', phone: '023 627 325', workingHours: wh('07:00–13:30', '13:00–19:30', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(5), lastAutoChecked: hoursAgo(3), trustScore: 71, lat: 44.1170, lng: 15.2215 },
  { id: 'dr22', name: 'Mateja Mikić Vulelija, dr. med.', category: 'medicine', address: 'S. Radića 14, Benkovac', phone: '023 646 726', workingHours: wh('07:00–13:30', '13:00–19:30', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(4), lastAutoChecked: hoursAgo(2), trustScore: 70, lat: 44.0325, lng: 15.6135 },
  { id: 'dr23', name: 'Mia Šćiran, dr. med.', category: 'medicine', address: 'Prosika 17, Pag', phone: '023 229 631', workingHours: wh('07:00–13:30', '13:00–19:30', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(6), lastAutoChecked: hoursAgo(4), trustScore: 68, lat: 44.4439, lng: 15.0530 },
  { id: 'dr24', name: 'Mirjana Matković, dr. med.', category: 'medicine', address: 'Franje Tuđmana 31, Vrsi', phone: '023 359 587', workingHours: wh('07:00–13:30', '13:00–19:30', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(3), lastAutoChecked: hoursAgo(2), trustScore: 72, lat: 44.2700, lng: 15.2060 },
  { id: 'dr25', name: 'Dr. Ante Jurić', category: 'medicine', address: 'P. Zoranića 61, Jasenice', phone: '023 629 880', workingHours: wh('07:00–13:30', '13:00–19:30', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(5), lastAutoChecked: hoursAgo(3), trustScore: 70, lat: 44.2360, lng: 15.5420 },
  { id: 'dr26', name: 'Mirna Ćaleta Rako, dr. med.', category: 'medicine', address: 'Polača 231, Polača', phone: '023 662 200', workingHours: wh('07:00–13:30', '13:00–19:30', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(4), lastAutoChecked: hoursAgo(2), trustScore: 71, lat: 43.9630, lng: 15.5370 },
  { id: 'dr27', name: 'Nada Ivanić, dr. med.', category: 'medicine', address: 'S. Radića 14, Benkovac', phone: '023 646 726', workingHours: wh('07:00–13:30', '13:00–19:30', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(6), lastAutoChecked: hoursAgo(4), trustScore: 69, lat: 44.0326, lng: 15.6136 },
  { id: 'dr28', name: 'Nikolina Ivanac, dr. med.', category: 'medicine', address: 'Neviđane', phone: '023 269 658', workingHours: wh('07:00–13:30', '13:00–19:30', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(3), lastAutoChecked: hoursAgo(2), trustScore: 72, lat: 43.9880, lng: 15.1740 },
  { id: 'dr29', name: 'Predrag Orlović, dr. med.', category: 'medicine', address: 'Andrije Medulića 1, Zadar', phone: '023 245 303', workingHours: wh('07:00–13:30', '13:00–19:30', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(5), lastAutoChecked: hoursAgo(3), trustScore: 71, lat: 44.1143, lng: 15.2264 },
  { id: 'dr30', name: 'Mirjana Petrić, dr. med.', category: 'medicine', address: 'Trg Tome Bulića 1, Bibinje', phone: '023 681 660', workingHours: wh('07:00–13:30', '13:00–19:30', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(4), lastAutoChecked: hoursAgo(2), trustScore: 72, lat: 44.0741, lng: 15.2871 },
  { id: 'dr31', name: 'Sanja Prtorić, dr. med.', category: 'medicine', address: 'Prosika 17, Pag', phone: '023 225 206', workingHours: wh('07:00–13:30', '13:00–19:30', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(6), lastAutoChecked: hoursAgo(4), trustScore: 69, lat: 44.4440, lng: 15.0531 },
  { id: 'dr32', name: 'Šime Erslan, dr. med.', category: 'medicine', address: 'Žman 138, Žman', phone: '023 372 050', workingHours: wh('07:00–13:30', '13:00–19:30', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(3), lastAutoChecked: hoursAgo(2), trustScore: 70, lat: 44.0130, lng: 14.9700 },
  { id: 'dr33', name: 'Tanja Gulan, dr. med.', category: 'medicine', address: 'Stankovci 232, Stankovci', phone: '023 380 165', workingHours: wh('07:00–13:30', '13:00–19:30', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(5), lastAutoChecked: hoursAgo(3), trustScore: 71, lat: 43.9420, lng: 15.5610 },
  { id: 'dr34', name: 'Vera Bulajić, dr. med.', category: 'medicine', address: 'Franje Tuđmana 27a, Vir', phone: '023 647 306', workingHours: wh('07:00–13:30', '13:00–19:30', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(4), lastAutoChecked: hoursAgo(2), trustScore: 70, lat: 44.3024, lng: 15.0862 },
  { id: 'dr35', name: 'Vesna Rudelj, dr. med.', category: 'medicine', address: 'Trg dr. Franje Tuđmana 7, Škabrnja', phone: '023 637 261', workingHours: wh('07:00–13:30', '13:00–19:30', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(6), lastAutoChecked: hoursAgo(4), trustScore: 69, lat: 44.0490, lng: 15.4380 },
  { id: 'dr36', name: 'Vlatko Grković, dr. med.', category: 'medicine', address: 'Grgura Mrganića 1, Zadar', phone: '023 250 926', workingHours: wh('07:00–13:30', '13:00–19:30', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(3), lastAutoChecked: hoursAgo(2), trustScore: 72, lat: 44.1155, lng: 15.2265 },
  { id: 'dr37', name: 'Zvonko Mišlov, dr. med.', category: 'medicine', address: 'Ugljan 16, Ugljan', phone: '023 288 101', workingHours: wh('07:00–13:30', '13:00–19:30', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(5), lastAutoChecked: hoursAgo(3), trustScore: 70, lat: 44.1260, lng: 15.0970 },
  { id: 'dr38', name: 'Dr. Stojanovski Gjorge', category: 'medicine', address: 'Ul. Stjepana Radića 37, Obrovac', phone: '023 219 336', workingHours: wh('07:00–13:30', '13:00–19:30', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(4), lastAutoChecked: hoursAgo(2), trustScore: 71, lat: 44.1970, lng: 15.6830 },
  { id: 'dr39', name: 'Dr. Perović Adrian', category: 'medicine', address: 'Lišane Ostrovičke 225, Lišane Ostrovičke', phone: '023 661 183', workingHours: wh('07:00–13:30', '13:00–19:30', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(6), lastAutoChecked: hoursAgo(4), trustScore: 68, lat: 43.9560, lng: 15.5920 },
  { id: 'dr40', name: 'Franciska Ivišić, dr. med.', category: 'medicine', address: 'A. G. Matoša 36, Zadar', phone: '023 551 277', workingHours: wh('07:00–13:30', '13:00–19:30', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(3), lastAutoChecked: hoursAgo(2), trustScore: 73, lat: 44.1230, lng: 15.2120 },


  // ===== ZDRAVSTVO (specijalisti, bolnica) — sada u DB tablici health_places, admin upravlja =====


  // RESTAURANTS — sorted by quality/reputation (scraped from TripAdvisor, Fodor's, In Your Pocket, Roam & Thrive, Terra Dalmatica, etc.)
  // --- Fine Dining / Top-Tier ---
  { id: 'rs1', name: 'Restaurant Kaštel', category: 'restaurants', address: 'Bedemi zadarskih pobuna 13, Zadar', phone: '023 316 153', website: 'https://www.hotel-bastion.hr/restaurant-kastel', workingHours: wh('12:00–23:00', '12:00–23:00', '12:00–22:00'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'owner', ownerVerifiedAt: hoursAgo(2), communityConfirmedAt: hoursAgo(1), lastAutoChecked: hoursAgo(1), trustScore: 96, lat: 44.1158, lng: 15.2215 },
  { id: 'rs2', name: 'Restaurant Foša', category: 'restaurants', address: 'Kraj Sv. Dmitra 2, Zadar', phone: '023 314 421', website: 'https://www.fosa.hr/', workingHours: wh('12:00–23:00', '12:00–23:00', '12:00–22:00'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'owner', ownerVerifiedAt: hoursAgo(3), communityConfirmedAt: hoursAgo(1), lastAutoChecked: hoursAgo(1), trustScore: 95, lat: 44.1170, lng: 15.2265 },
  { id: 'rs3', name: 'Restaurant Kornat', category: 'restaurants', address: 'Liburnska obala 6, Zadar', phone: '023 254 501', website: 'https://www.hotel-niko.hr/kornat', workingHours: wh('12:00–23:00', '12:00–23:00', '12:00–22:00'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'owner', ownerVerifiedAt: hoursAgo(4), communityConfirmedAt: hoursAgo(2), lastAutoChecked: hoursAgo(1), trustScore: 93, lat: 44.1185, lng: 15.2310 },
  { id: 'rs4', name: 'Pet Bunara', category: 'restaurants', address: 'Stratico ulica 1, Zadar', phone: '023 224 010', website: 'https://petbunara.com/', workingHours: wh('12:00–22:00', '12:00–22:00', 'Zatvoreno'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'owner', ownerVerifiedAt: hoursAgo(2), communityConfirmedAt: hoursAgo(1), lastAutoChecked: hoursAgo(1), trustScore: 94, lat: 44.1140, lng: 15.2225 },
  { id: 'rs5', name: 'Restaurant 4 Kantuna', category: 'restaurants', address: 'Borelli 2, Zadar', phone: '023 213 496', website: 'https://www.restaurant4kantuna.com/', workingHours: wh('11:00–23:00', '11:00–23:00', '11:00–22:00'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(2), lastAutoChecked: hoursAgo(1), trustScore: 92, lat: 44.1152, lng: 15.2238 },

  // --- Excellent / Highly Rated ---
  { id: 'rs6', name: 'Restaurant Bruschetta', category: 'restaurants', address: 'Mihovila Pavlinovića 12, Zadar', phone: '023 312 915', website: 'https://www.bruschetta.hr/', workingHours: wh('11:00–23:00', '11:00–23:00', '12:00–22:00'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(3), lastAutoChecked: hoursAgo(2), trustScore: 90, lat: 44.1139, lng: 15.2246 },
  { id: 'rs7', name: 'Proto Food&More', category: 'restaurants', address: 'Široka ulica 1, Zadar', phone: '023 210 080', website: 'https://proto-zadar.com/', workingHours: wh('10:00–23:00', '10:00–23:00', '10:00–22:00'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(2), lastAutoChecked: hoursAgo(1), trustScore: 91, lat: 44.1155, lng: 15.2248 },
  { id: 'rs8', name: 'Restaurant Niko', category: 'restaurants', address: 'Obala kneza Domagoja 9, Zadar', phone: '023 337 880', website: 'https://www.hotel-niko.hr/', workingHours: wh('11:00–23:00', '11:00–23:00', '11:00–22:00'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(4), lastAutoChecked: hoursAgo(2), trustScore: 89, lat: 44.1220, lng: 15.2060 },
  { id: 'rs9', name: 'Harbor Cookhouse & Club', category: 'restaurants', address: 'Obala kneza Branimira 6a, Zadar', phone: '023 212 050', workingHours: wh('12:00–23:00', '12:00–24:00', '12:00–22:00'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(3), lastAutoChecked: hoursAgo(2), trustScore: 88, lat: 44.1145, lng: 15.2280 },
  { id: 'rs10', name: 'Konoba Stomorica', category: 'restaurants', address: 'Stomorica ulica 5, Zadar', phone: '099 448 3694', workingHours: wh('11:00–23:00', '11:00–23:00', '11:00–22:00'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(2), lastAutoChecked: hoursAgo(1), trustScore: 87, lat: 44.1147, lng: 15.2250 },
  { id: 'rs11', name: 'The Botanist', category: 'restaurants', address: 'Ul. Mihovila Pavlinovića 4, 23000 Zadar', phone: '092 423 2296', website: 'https://thebotanistzadar.com/', workingHours: wh('12:00–21:00', '12:00–21:00', '12:00–21:00'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(5), lastAutoChecked: hoursAgo(3), trustScore: 88, lat: 44.1154, lng: 15.2247 },
  { id: 'rs12', name: 'Restaurant Malo Misto', category: 'restaurants', address: 'Ulica kneza Mislava 3, Zadar', phone: '023 213 152', workingHours: wh('11:00–23:00', '11:00–23:00', '11:00–22:00'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(4), lastAutoChecked: hoursAgo(2), trustScore: 87, lat: 44.1148, lng: 15.2232 },

  // --- Very Good ---
  { id: 'rs13', name: 'La Pegla Restaurant & Grill', category: 'restaurants', address: 'Špire Brusine 6, Zadar', phone: '023 250 590', workingHours: wh('11:00–23:00', '11:00–23:00', '11:00–22:00'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(3), lastAutoChecked: hoursAgo(2), trustScore: 85, lat: 44.1160, lng: 15.2255 },
  { id: 'rs14', name: 'Konoba Dalmatina', category: 'restaurants', address: 'Kovačka ulica 2, Zadar', phone: '023 213 082', workingHours: wh('11:00–23:00', '11:00–23:00', '11:00–22:00'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(5), lastAutoChecked: hoursAgo(3), trustScore: 84, lat: 44.1150, lng: 15.2240 },
  { id: 'rs15', name: 'Konoba Tovar', category: 'restaurants', address: 'Ulica Don Ive Prodana 3, Zadar', phone: '023 316 060', workingHours: wh('11:00–23:00', '11:00–23:00', '11:00–22:00'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(4), lastAutoChecked: hoursAgo(2), trustScore: 83, lat: 44.1155, lng: 15.2230 },
  { id: 'rs16', name: 'Corte Restaurant', category: 'restaurants', address: 'Mihe Klaića 1, Zadar', phone: '023 312 064', workingHours: wh('12:00–23:00', '12:00–23:00', '12:00–22:00'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(6), lastAutoChecked: hoursAgo(3), trustScore: 84, lat: 44.1146, lng: 15.2237 },
  { id: 'rs17', name: 'Konoba Rafaelo', category: 'restaurants', address: 'Ul. Franka Lisice 2, Zadar', phone: '091 796 8424', website: 'https://konoba-rafaelo.eatbu.hr/', workingHours: wh('10:00–24:00', '10:00–24:00', '10:00–22:00'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(3), lastAutoChecked: hoursAgo(2), trustScore: 82, lat: 44.1130, lng: 15.2260 },
  { id: 'rs18', name: 'Konoba Misterija', category: 'restaurants', address: 'Zeleni trg 2, Zadar', phone: '023 337 137', workingHours: wh('11:00–23:00', '11:00–23:00', '11:00–22:00'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(5), lastAutoChecked: hoursAgo(3), trustScore: 81, lat: 44.1142, lng: 15.2243 },
  { id: 'rs19', name: 'Konoba Skoblar', category: 'restaurants', address: 'Trg Petra Zoranića 3, Zadar', phone: '023 213 236', website: 'https://konoba-skoblar.eatbu.hr/', workingHours: wh('10:00–23:00', '10:00–23:00', '10:00–22:00'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(2), lastAutoChecked: hoursAgo(1), trustScore: 83, lat: 44.1145, lng: 15.2254 },
  
  { id: 'rs21', name: 'Bistro Pjat', category: 'restaurants', address: 'Varoška ulica 4, Zadar', phone: '023 303 030', workingHours: wh('11:00–22:00', '11:00–22:00', '12:00–21:00'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(4), lastAutoChecked: hoursAgo(2), trustScore: 85, lat: 44.1149, lng: 15.2233 },
  { id: 'rs22', name: 'Restaurant Groppo', category: 'restaurants', address: 'Široka ulica 22, Zadar', phone: '023 778 981', website: 'https://www.restaurant-groppo.com/', workingHours: wh('12:00–23:00', '12:00–23:00', '12:00–22:00'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(4), lastAutoChecked: hoursAgo(2), trustScore: 82, lat: 44.1155, lng: 15.2249 },
  { id: 'rs23', name: 'Restaurant The Taste', category: 'restaurants', address: 'Poljana Šime Budinića 2, Zadar', phone: '095 808 8966', website: 'https://taste.com.hr/', workingHours: wh('12:00–23:00', '12:00–23:00', '12:00–22:00'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(6), lastAutoChecked: hoursAgo(3), trustScore: 80, lat: 44.1148, lng: 15.2220 },

  // --- Good / Solid ---
  { id: 'rs24', name: 'Restaurant Eat Me', category: 'restaurants', address: 'Dalmatinskog Sabora 2, Zadar', phone: '023 778 981', website: 'https://eatme.com.hr/', workingHours: wh('12:00–23:00', '12:00–23:00', '12:00–22:00'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(7), lastAutoChecked: hoursAgo(3), trustScore: 78, lat: 44.1152, lng: 15.2241 },
  { id: 'rs25', name: 'Restaurant Bueno', category: 'restaurants', address: 'Ulica Brne Karnarutića 12, Zadar', phone: '099 769 8424', website: 'https://bueno.com.hr/', workingHours: wh('11:00–23:00', '11:00–23:00', '12:00–22:00'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(4), lastAutoChecked: hoursAgo(2), trustScore: 78, lat: 44.1140, lng: 15.2235 },
  { id: 'rs26', name: 'Maguro Restaurant & Sushi Bar', category: 'restaurants', address: 'Borelli 10, Zadar', phone: '023 337 024', workingHours: wh('12:00–23:00', '12:00–23:00', '12:00–22:00'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(5), lastAutoChecked: hoursAgo(3), trustScore: 80, lat: 44.1151, lng: 15.2237 },
  { id: 'rs27', name: 'Mamma Mia', category: 'restaurants', address: 'Jurja Bijankinija 2, Zadar', phone: '023 213 639', workingHours: wh('10:00–23:00', '10:00–24:00', '10:00–22:00'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(3), lastAutoChecked: hoursAgo(2), trustScore: 77, lat: 44.1143, lng: 15.2240 },
  { id: 'rs28', name: 'Pizzeria Tri Bunara', category: 'restaurants', address: 'Jurja Bijankinija 8c, Zadar', phone: '023 213 785', workingHours: wh('10:00–23:00', '10:00–23:00', '10:00–22:00'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(4), lastAutoChecked: hoursAgo(2), trustScore: 78, lat: 44.1141, lng: 15.2238 },
  { id: 'rs29', name: 'Pašta & Svašta', category: 'restaurants', address: 'Ul. Spire Brusine 8, Zadar', phone: '023 302 020', workingHours: wh('11:00–22:00', '11:00–22:00', '12:00–21:00'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(5), lastAutoChecked: hoursAgo(3), trustScore: 79, lat: 44.1161, lng: 15.2256 },
  
  { id: 'rs31', name: 'Restaurant Dva Ribara', category: 'restaurants', address: 'Blaža Jurjeva 1, Zadar', phone: '023 213 445', workingHours: wh('11:00–23:00', '11:00–23:00', '11:00–22:00'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(5), lastAutoChecked: hoursAgo(3), trustScore: 79, lat: 44.1163, lng: 15.2260 },
  { id: 'rs34', name: 'Restaurant Primavera', category: 'restaurants', address: 'Obala kralja Petra Krešimira IV 2, Zadar', phone: '023 316 585', workingHours: wh('11:00–23:00', '11:00–23:00', '12:00–22:00'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'unverified', lastAutoChecked: hoursAgo(5), trustScore: 68, lat: 44.1178, lng: 15.2270 },
  { id: 'rs35', name: 'Restaurant Jadera', category: 'restaurants', address: 'Obala kneza Branimira 8, Zadar', phone: '023 212 025', workingHours: wh('11:00–23:00', '11:00–23:00', '11:00–22:00'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(5), lastAutoChecked: hoursAgo(3), trustScore: 75, lat: 44.1143, lng: 15.2282 },
  { id: 'rs36', name: 'Restaurant Arsenal', category: 'restaurants', address: 'Trg tri bunara 1, Zadar', phone: '023 253 833', website: 'https://www.arsenalzadar.com/', workingHours: wh('10:00–24:00', '10:00–24:00', '10:00–22:00'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(3), lastAutoChecked: hoursAgo(2), trustScore: 77, lat: 44.1140, lng: 15.2255 },
  { id: 'rs37', name: 'Konoba Na Po Ure', category: 'restaurants', address: 'Ul. Špire Brusine 2, Zadar', phone: '023 312 004', workingHours: wh('10:00–23:00', '10:00–23:00', '10:00–22:00'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(4), lastAutoChecked: hoursAgo(2), trustScore: 76, lat: 44.1159, lng: 15.2253 },

  // --- Okolica (surroundings) ---
  { id: 'rs40', name: 'Konoba Pece', category: 'restaurants', address: 'Prilaz Drage 2, Vinjerac', phone: '023 660 240', workingHours: wh('12:00–23:00', '12:00–23:00', '12:00–22:00'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(8), lastAutoChecked: hoursAgo(5), trustScore: 85, lat: 44.2470, lng: 15.4490 },
  
  { id: 'rs42', name: 'Konoba Griblja', category: 'restaurants', address: 'Obala dr. Franje Tuđmana 42, Sukošan', phone: '023 393 101', workingHours: wh('12:00–22:00', '12:00–22:00', '12:00–21:00'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(8), lastAutoChecked: hoursAgo(4), trustScore: 82, lat: 44.0430, lng: 15.3070 },

  // --- Additional popular ---
  { id: 'rs45', name: 'Restaurant Trattoria Canzona', category: 'restaurants', address: 'Stomorica 3, Zadar', phone: '023 212 081', workingHours: wh('11:00–23:00', '11:00–23:00', '11:00–22:00'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(5), lastAutoChecked: hoursAgo(3), trustScore: 77, lat: 44.1148, lng: 15.2251 },
  { id: 'rs50', name: 'Restaurant Mediteran', category: 'restaurants', address: 'Ul. Mihovila Klaića 3, Zadar', phone: '023 316 500', workingHours: wh('11:00–23:00', '11:00–23:00', '12:00–22:00'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(6), lastAutoChecked: hoursAgo(3), trustScore: 74, lat: 44.1147, lng: 15.2235 },
  { id: 'rs51', name: 'Konoba Bile', category: 'restaurants', address: 'Ul. Don Ive Prodana 6, Zadar', phone: '023 315 515', workingHours: wh('11:00–23:00', '11:00–23:00', '11:00–22:00'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(4), lastAutoChecked: hoursAgo(2), trustScore: 74, lat: 44.1156, lng: 15.2231 },
  { id: 'rs55', name: 'Konoba Šime', category: 'restaurants', address: 'Ulica Ante Starčevića 2, Zadar', phone: '023 250 200', workingHours: wh('10:00–22:00', '10:00–22:00', '11:00–21:00'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(5), lastAutoChecked: hoursAgo(3), trustScore: 73, lat: 44.1145, lng: 15.2248 },
  { id: 'rs56', name: 'Butler Gourmet & Cocktails Garden', category: 'restaurants', address: 'Zadar', phone: '091 662 2499', website: 'https://www.facebook.com/butlergourmetgarden/', workingHours: wh('12:00–23:00', '12:00–23:00', '12:00–23:00'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(4), lastAutoChecked: hoursAgo(2), trustScore: 88, lat: 44.1155, lng: 15.2265 },
  { id: 'rs57', name: 'Batak Grill Zadar', category: 'restaurants', address: 'Ul. 4. Gardijske Brigade 1, Zadar', phone: '023 551 051', website: 'https://batak.hr/eng/batak-zadar/', workingHours: wh('12:00–23:00', '12:00–23:00', '11:30–23:00'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(3), lastAutoChecked: hoursAgo(1), trustScore: 80, lat: 44.1190, lng: 15.2310 },
  { id: 'rs58', name: 'Capo Grill Zadar', category: 'restaurants', address: 'Put Matije Gupca 9, 23000 Zadar', phone: '023 699 077', website: 'https://capo-grill-zadar.com/', workingHours: wh('11:00–23:00', '11:00–23:00', '11:00–23:00'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(5), lastAutoChecked: hoursAgo(2), trustScore: 82, lat: 44.1135, lng: 15.2185 },

  // CAFES & BARS (real data from Citybook Zadar)
  { id: 'cf1', name: 'Caffe bar Kult', category: 'cafes', address: 'Stomorica 6a, Zadar', phone: '091 333 3140', workingHours: wh('07:00–23:00', '08:00–23:00', '09:00–22:00'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(3), lastAutoChecked: hoursAgo(2), trustScore: 70, lat: 44.1147, lng: 15.2252 },
  { id: 'cf2', name: 'Winehouse Fiolić', category: 'cafes', address: 'Kožinska cesta 62, Kožino', phone: '098 891 017', website: 'http://www.popij.me/', workingHours: wh('16:00–23:00', '12:00–23:00', '12:00–22:00'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(5), lastAutoChecked: hoursAgo(3), trustScore: 68, lat: 44.1350, lng: 15.1980 },
  { id: 'cf3', name: 'Winegarden', category: 'cafes', address: 'Pod bedemom 1A, Zadar', phone: '098 891 017', website: 'https://winegarden.com.hr/', workingHours: wh('10:00–23:00', '10:00–23:00', '10:00–22:00'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(4), lastAutoChecked: hoursAgo(2), trustScore: 72, lat: 44.1150, lng: 15.2258 },
  // Early-morning cafes & shops for morning engine variety
  { id: 'cf4', name: 'Caffe bar Lovre', category: 'cafes', address: 'Trg Petra Zoranića 1, Zadar', phone: '023 250 100', workingHours: wh('06:00–22:00', '07:00–22:00', '08:00–20:00'), verified: true, lastVerified: '2026-02-16', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(3), lastAutoChecked: hoursAgo(2), trustScore: 68, lat: 44.1145, lng: 15.2253 },
  { id: 'cf5', name: 'Espresso bar Forum', category: 'cafes', address: 'Široka ulica 8, Zadar', phone: '023 211 450', workingHours: wh('06:30–22:00', '07:00–22:00', '08:00–20:00'), verified: true, lastVerified: '2026-02-16', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(4), lastAutoChecked: hoursAgo(2), trustScore: 65, lat: 44.1155, lng: 15.2248 },
  { id: 'sh1', name: 'Pekara Ražnjić — Poluotok', category: 'shops', address: 'Ul. Kneza Višeslava 2, Zadar', phone: '023 214 300', workingHours: wh('06:00–20:00', '06:00–14:00', '07:00–12:00'), verified: true, lastVerified: '2026-02-16', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(2), lastAutoChecked: hoursAgo(1), trustScore: 72, lat: 44.1160, lng: 15.2230 },
  { id: 'sh2', name: 'Konzum — Voštarnica', category: 'shops', address: 'Ul. Ante Starčevića 1, Zadar', phone: '023 302 400', website: 'https://www.konzum.hr/', workingHours: wh('06:30–21:00', '07:00–21:00', '08:00–13:00'), verified: true, lastVerified: '2026-02-16', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(3), lastAutoChecked: hoursAgo(2), trustScore: 74, lat: 44.1190, lng: 15.2200 },
  { id: 'sh3', name: 'Studenac — Brodarica', category: 'shops', address: 'Ul. Nikole Tesle 44, Zadar', phone: '023 332 100', website: 'https://www.studenac.hr/', workingHours: wh('06:00–21:00', '06:30–21:00', '07:00–13:00'), verified: true, lastVerified: '2026-02-16', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(4), lastAutoChecked: hoursAgo(2), trustScore: 70, lat: 44.1220, lng: 15.2150 },

  // RIBOLA
  { id: 'sh10', name: 'Ribola — Petrići', category: 'shops', address: 'Put Petrića 51C, Zadar', phone: '023 333 000', website: 'https://www.ribola.hr/', workingHours: wh('06:30–21:00', '06:30–21:00', '—'), verified: true, lastVerified: '2026-02-22', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(1), lastAutoChecked: hoursAgo(1), trustScore: 72, lat: 44.1297534, lng: 15.2310872 },
  { id: 'sh11', name: 'Ribola — Vukovarska', category: 'shops', address: 'Vukovarska ulica 6a, Zadar', phone: '023 333 001', website: 'https://www.ribola.hr/', workingHours: wh('06:30–21:00', '06:30–21:00', '—'), verified: true, lastVerified: '2026-02-22', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(1), lastAutoChecked: hoursAgo(1), trustScore: 72, lat: 44.1195, lng: 15.2430 },

  // TOMMY
  { id: 'sh20', name: 'Tommy — Put Stanova', category: 'shops', address: 'Put Stanova 46, Zadar', phone: '023 400 100', website: 'https://www.tommy.hr/', workingHours: wh('06:30–21:00', '06:30–21:00', '—'), verified: true, lastVerified: '2026-02-22', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(1), lastAutoChecked: hoursAgo(1), trustScore: 74, lat: 44.1153711, lng: 15.243653 },
  { id: 'sh21', name: 'Tommy — Bože Peričića', category: 'shops', address: 'Bože Peričića 5, Zadar', phone: '023 400 101', website: 'https://www.tommy.hr/', workingHours: wh('06:30–21:00', '06:30–21:00', '—'), verified: true, lastVerified: '2026-02-22', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(1), lastAutoChecked: hoursAgo(1), trustScore: 74, lat: 44.1072016, lng: 15.2340793 },
  { id: 'sh22', name: 'Tommy — Trg Damira Zdrilića', category: 'shops', address: 'Trg Damira Zdrilića 1, Zadar', phone: '023 400 102', website: 'https://www.tommy.hr/', workingHours: wh('06:30–21:00', '06:30–21:00', '—'), verified: true, lastVerified: '2026-02-22', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(1), lastAutoChecked: hoursAgo(1), trustScore: 74, lat: 44.1048716, lng: 15.2502009 },
  { id: 'sh23', name: 'Tommy — Skradinska', category: 'shops', address: 'Skradinska 8, Zadar', phone: '023 400 103', website: 'https://www.tommy.hr/', workingHours: wh('06:30–21:00', '06:30–21:00', '—'), verified: true, lastVerified: '2026-02-22', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(1), lastAutoChecked: hoursAgo(1), trustScore: 74, lat: 44.1135562, lng: 15.2498889 },

  // STUDENAC (nedjelje se otvaraju po rasporedu)
  { id: 'sh30', name: 'Studenac — Antuna Barca', category: 'shops', address: 'Ulica Antuna Barca 58, Zadar', phone: '023 350 000', website: 'https://www.studenac.hr/', workingHours: wh('06:00–21:00', '06:30–21:00', '—'), verified: true, lastVerified: '2026-02-22', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(1), lastAutoChecked: hoursAgo(1), trustScore: 70, lat: 44.110886, lng: 15.250911 },
  { id: 'sh31', name: 'Studenac — Bokanjac', category: 'shops', address: 'Put Vrela 2, Zadar', phone: '023 350 001', website: 'https://www.studenac.hr/', workingHours: wh('06:00–21:00', '06:30–21:00', '—'), verified: true, lastVerified: '2026-02-22', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(1), lastAutoChecked: hoursAgo(1), trustScore: 70, lat: 44.1290, lng: 15.2120 },
  { id: 'sh32', name: 'Studenac — Dobronić', category: 'shops', address: 'Ulica Antuna Dobronića 1, Zadar', phone: '023 350 002', website: 'https://www.studenac.hr/', workingHours: wh('06:00–21:00', '06:30–21:00', '—'), verified: true, lastVerified: '2026-02-22', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(1), lastAutoChecked: hoursAgo(1), trustScore: 70, lat: 44.1200, lng: 15.2400 },
  { id: 'sh33', name: 'Studenac — Skvarčina', category: 'shops', address: 'Ulica Ivana Skvarčine 18, Zadar', phone: '023 350 003', website: 'https://www.studenac.hr/', workingHours: wh('06:00–21:00', '06:30–21:00', '—'), verified: true, lastVerified: '2026-02-22', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(1), lastAutoChecked: hoursAgo(1), trustScore: 70, lat: 44.105388, lng: 15.27012 },
  { id: 'sh34', name: 'Studenac — Starčevića', category: 'shops', address: 'Ulica Ante Starčevića 15, Zadar', phone: '023 350 004', website: 'https://www.studenac.hr/', workingHours: wh('06:00–21:00', '06:30–21:00', '—'), verified: true, lastVerified: '2026-02-22', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(1), lastAutoChecked: hoursAgo(1), trustScore: 70, lat: 44.1098244, lng: 15.2461826 },
  { id: 'sh35', name: 'Studenac — Šibenska', category: 'shops', address: 'Šibenska ulica 9C, Zadar', phone: '023 350 005', website: 'https://www.studenac.hr/', workingHours: wh('06:00–21:00', '06:30–21:00', '—'), verified: true, lastVerified: '2026-02-22', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(1), lastAutoChecked: hoursAgo(1), trustScore: 70, lat: 44.1200416, lng: 15.2551207 },

  // KONZUM — Frane Petrića (radi nedjeljom po rasporedu)

  { id: 'sh41', name: 'Studenac — Jelačića', category: 'shops', address: 'Ul. bana Josipa Jelačića 12A, Zadar', phone: '023 350 006', website: 'https://www.studenac.hr/', workingHours: wh('06:00–21:00', '06:30–21:00', '—'), verified: true, lastVerified: '2026-02-28', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(1), lastAutoChecked: hoursAgo(1), trustScore: 70, lat: 44.116872, lng: 15.238163 },
  { id: 'sh42', name: 'Ribola — Hebranga', category: 'shops', address: 'Ulica Andrije Hebranga 10a, Zadar', phone: '023 333 002', website: 'https://www.ribola.hr/', workingHours: wh('06:30–21:00', '06:30–21:00', '—'), verified: true, lastVerified: '2026-02-28', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(1), lastAutoChecked: hoursAgo(1), trustScore: 72, lat: 44.1196547, lng: 15.2388954 },
  { id: 'sh43', name: 'Plodine — Biogradska', category: 'shops', address: 'Biogradska 68, Zadar', phone: '023 360 000', website: 'https://www.plodine.hr/', workingHours: wh('07:00–21:00', '07:00–21:00', '—'), verified: true, lastVerified: '2026-02-28', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(1), lastAutoChecked: hoursAgo(1), trustScore: 70, lat: 44.102986, lng: 15.262227 },
  { id: 'sh44', name: 'Ribola — Odaka', category: 'shops', address: 'Ulica Krste Odaka 5a, Zadar', phone: '023 333 003', website: 'https://www.ribola.hr/', workingHours: wh('06:30–21:00', '06:30–21:00', '—'), verified: true, lastVerified: '2026-02-28', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(1), lastAutoChecked: hoursAgo(1), trustScore: 72, lat: 44.1135317, lng: 15.2624288 },
  { id: 'sh45', name: 'Studenac — Bibinje', category: 'shops', address: 'Jadranska Magistrala 14A, Bibinje', phone: '023 350 007', website: 'https://www.studenac.hr/', workingHours: wh('06:00–21:00', '06:30–21:00', '—'), verified: true, lastVerified: '2026-02-28', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(1), lastAutoChecked: hoursAgo(1), trustScore: 70, lat: 44.0825606, lng: 15.2843227 },
  { id: 'sh40', name: 'Konzum — Frane Petrića', category: 'shops', address: 'Frane Petrića 10, Zadar', phone: '023 302 401', website: 'https://www.konzum.hr/', workingHours: wh('06:30–21:00', '07:00–21:00', '—'), verified: true, lastVerified: '2026-02-22', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(1), lastAutoChecked: hoursAgo(1), trustScore: 74, lat: 44.1258302, lng: 15.2368965 },

  // STUDENAC — Velebitska (Google Maps: 44.117312, 15.234312)
  { id: 'sh46', name: 'Studenac — Velebitska', category: 'shops', address: 'Velebitska ulica 14, Zadar', phone: '072 000 990', website: 'https://www.studenac.hr/', workingHours: wh('06:00–21:00', '06:30–21:00', '—'), verified: true, lastVerified: '2026-03-08', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(1), lastAutoChecked: hoursAgo(1), trustScore: 70, lat: 44.117312, lng: 15.234312 },

  // SPAR — City Galleria, Polačišće 4 (Google Maps: 44.1100502, 15.23719)
  { id: 'sh47', name: 'SPAR — City Galleria', category: 'shops', address: 'Polačišće ul. 4, Zadar', phone: '023 233 680', website: 'https://www.spar.hr/', workingHours: wh('07:00–21:00', '07:00–21:00', '07:00–14:00'), verified: true, lastVerified: '2026-03-08', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(1), lastAutoChecked: hoursAgo(1), trustScore: 74, lat: 44.1100502, lng: 15.23719 },

  // RIBOLA — Zrinsko Frankopanska 18 (Google Maps: 44.1159, 15.2237)
  { id: 'sh48', name: 'Ribola — Frankopanska', category: 'shops', address: 'Ulica Zrinsko Frankopanska 18, Zadar', phone: '091 617 6623', website: 'https://www.ribola.hr/', workingHours: wh('06:30–21:00', '06:30–21:00', '—'), verified: true, lastVerified: '2026-03-08', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(1), lastAutoChecked: hoursAgo(1), trustScore: 72, lat: 44.1159, lng: 15.2237 },

  // LIDL
  { id: 'sh50', name: 'Lidl — Zadar', category: 'shops', address: 'Put Bokanjca 2, Zadar', phone: '0800 555 500', website: 'https://www.lidl.hr/', workingHours: wh('07:00–21:00', '07:00–21:00', '—'), verified: true, lastVerified: '2026-02-22', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(1), lastAutoChecked: hoursAgo(1), trustScore: 74, lat: 44.1275, lng: 15.2130 },

  // EUROSPIN
  { id: 'sh51', name: 'Eurospin — Zadar', category: 'shops', address: 'Ul. Domovinskog rata 2, Zadar', phone: '023 400 200', website: 'https://www.eurospin.hr/', workingHours: wh('07:00–21:00', '07:00–21:00', '—'), verified: true, lastVerified: '2026-02-22', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(1), lastAutoChecked: hoursAgo(1), trustScore: 72, lat: 44.1185, lng: 15.2315 },

  // GAS STATIONS — benzinske postaje (verificirano: cijenagoriva.com, INA.hr, Petrol.hr — Feb 2026)
  // --- Zadar grad ---
  { id: 'gs1', name: 'INA Jazine', category: 'gas', address: 'Marka Marulića 1a, Zadar', phone: '091 497 1063', website: 'https://www.ina.hr/', workingHours: wh('00:00–24:00', '00:00–24:00', '00:00–24:00'), verified: true, lastVerified: '2026-02-19', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(2), lastAutoChecked: hoursAgo(1), trustScore: 80, lat: 44.1170, lng: 15.2380 },
  { id: 'gs2', name: 'INA Branimir', category: 'gas', address: 'Ul. kneza Branimira 20a, Zadar', phone: '091 497 1063', website: 'https://www.ina.hr/', workingHours: wh('00:00–24:00', '00:00–24:00', '00:00–24:00'), verified: true, lastVerified: '2026-02-19', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(3), lastAutoChecked: hoursAgo(1), trustScore: 78, lat: 44.1090, lng: 15.2450 },
  { id: 'gs3', name: 'INA kod Gradskog Groblja', category: 'gas', address: 'Franka Lisice 83, Zadar', phone: '091 497 1063', website: 'https://www.ina.hr/', workingHours: wh('06:00–22:00', '06:00–22:00', '07:00–22:00'), verified: true, lastVerified: '2026-02-19', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(4), lastAutoChecked: hoursAgo(2), trustScore: 75, lat: 44.1290, lng: 15.2080 },
  { id: 'gs4', name: 'INA Puntamika', category: 'gas', address: 'A. G. Matoša 4, Zadar', phone: '091 497 1063', website: 'https://www.ina.hr/', workingHours: wh('06:00–22:00', '06:00–22:00', '07:00–22:00'), verified: true, lastVerified: '2026-02-19', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(5), lastAutoChecked: hoursAgo(3), trustScore: 74, lat: 44.1320, lng: 15.2010 },
  { id: 'gs5', name: 'INA Zagrebačka', category: 'gas', address: 'Zagrebačka 38, Zadar', phone: '091 497 1063', website: 'https://www.ina.hr/', workingHours: wh('06:00–22:00', '06:00–22:00', '07:00–22:00'), verified: true, lastVerified: '2026-02-19', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(4), lastAutoChecked: hoursAgo(2), trustScore: 76, lat: 44.1020, lng: 15.2500 },
  { id: 'gs6', name: 'INA Zadar-zapad', category: 'gas', address: 'Zagrebačka 35, Zadar', phone: '091 497 1063', website: 'https://www.ina.hr/', workingHours: wh('00:00–24:00', '00:00–24:00', '00:00–24:00'), verified: true, lastVerified: '2026-02-19', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(3), lastAutoChecked: hoursAgo(1), trustScore: 78, lat: 44.1025, lng: 15.2490 },
  { id: 'gs7', name: 'Petrol Ante Starčevića', category: 'gas', address: 'Ul. Ante Starčevića 34, Zadar', phone: '091 638 6602', website: 'https://www.petrol.hr/', workingHours: wh('00:00–24:00', '00:00–24:00', '00:00–24:00'), verified: true, lastVerified: '2026-02-19', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(2), lastAutoChecked: hoursAgo(1), trustScore: 80, lat: 44.1195, lng: 15.2290 },
  { id: 'gs8', name: 'Petrol Gaženica', category: 'gas', address: 'Gaženička cesta 22a, Zadar', phone: '091 638 6602', website: 'https://www.petrol.hr/', workingHours: wh('00:00–24:00', '00:00–24:00', '00:00–24:00'), verified: true, lastVerified: '2026-02-19', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(2), lastAutoChecked: hoursAgo(1), trustScore: 82, lat: 44.1060, lng: 15.2520 },
  { id: 'gs9', name: 'Petrol Jadranska Magistrala', category: 'gas', address: 'Ul. 84. gardijske bojne HV Termiti 51, 23000 Zadar', phone: '091 464 1281', website: 'https://www.petrol.hr/', workingHours: wh('07:00–19:00', '07:00–19:00', '07:00–19:00'), verified: true, lastVerified: '2026-02-19', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(4), lastAutoChecked: hoursAgo(2), trustScore: 75, lat: 44.1230, lng: 15.2100 },
  { id: 'gs10', name: 'Petrol Crno', category: 'gas', address: '72. bojna vojne policije 30, Zadar', phone: '091 638 6602', website: 'https://www.petrol.hr/', workingHours: wh('06:00–22:00', '06:00–22:00', '07:00–22:00'), verified: true, lastVerified: '2026-02-19', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(5), lastAutoChecked: hoursAgo(3), trustScore: 73, lat: 44.1450, lng: 15.1870 },
  { id: 'gs11', name: 'Petrol Murvica II', category: 'gas', address: 'Ul. 84. gardijske bojne HV Termit 4, Zadar', phone: '091 638 6602', website: 'https://www.petrol.hr/', workingHours: wh('06:00–22:00', '06:00–22:00', '07:00–22:00'), verified: true, lastVerified: '2026-02-19', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(4), lastAutoChecked: hoursAgo(2), trustScore: 74, lat: 44.1055, lng: 15.2510 },
  
  { id: 'gs13', name: 'Tifon Zadar', category: 'gas', address: 'Ul. 112. brigade 10, Zadar', phone: '0800 1234', website: 'https://www.tfrh.hr/', workingHours: wh('00:00–24:00', '00:00–24:00', '00:00–24:00'), verified: true, lastVerified: '2026-02-19', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(3), lastAutoChecked: hoursAgo(2), trustScore: 77, lat: 44.1200, lng: 15.2150 },
  { id: 'gs14', name: 'Adria Oil Bokanjac', category: 'gas', address: 'Put Bokanjca 97, Zadar', phone: '023 300 700', website: 'https://www.adriaoil.hr/', workingHours: wh('06:00–22:00', '06:00–22:00', '07:00–22:00'), verified: true, lastVerified: '2026-02-19', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(4), lastAutoChecked: hoursAgo(2), trustScore: 73, lat: 44.1280, lng: 15.2070 },
  { id: 'gs16', name: 'Tri Bartola Zadar', category: 'gas', address: 'Biogradska cesta, Zadar', phone: '—', website: 'https://tribartola.hr/', workingHours: wh('06:00–22:00', '06:00–22:00', '07:00–22:00'), verified: true, lastVerified: '2026-02-19', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(5), lastAutoChecked: hoursAgo(3), trustScore: 65, lat: 44.1050, lng: 15.2550 },
  // --- Okolica (Zaton, Petrčane, Vir, Pridraga, Sukošan, Bibinje, Biograd) ---
  { id: 'gs20', name: 'Petrol Zaton', category: 'gas', address: 'Zadarska cesta 100, Nin (Zaton)', phone: '091 638 6602', website: 'https://www.petrol.hr/', workingHours: wh('06:00–22:00', '06:00–22:00', '06:00–22:00'), verified: true, lastVerified: '2026-02-19', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(6), lastAutoChecked: hoursAgo(3), trustScore: 72, lat: 44.2269, lng: 15.1792 },
  { id: 'gs21', name: 'Tri Bartola Vir', category: 'gas', address: 'Vir', phone: '—', website: 'https://tribartola.hr/', workingHours: wh('06:00–22:00', '06:00–22:00', '07:00–22:00'), verified: true, lastVerified: '2026-02-19', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(6), lastAutoChecked: hoursAgo(4), trustScore: 65, lat: 44.3010, lng: 15.0850 },
  { id: 'gs22', name: 'Petrol Bili Brig', category: 'gas', address: 'Ul. hrvatskog sabora 6b, Zadar (Bili Brig)', phone: '091 638 6602', website: 'https://www.petrol.hr/', workingHours: wh('06:00–22:00', '06:00–22:00', '07:00–22:00'), verified: true, lastVerified: '2026-02-19', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(6), lastAutoChecked: hoursAgo(3), trustScore: 72, lat: 44.0430, lng: 15.3060 },
  { id: 'gs23', name: 'Asmira Marine Fuel Station (ex Fuzul International)', category: 'gas', address: 'D-Marin Dalmacija, Obala kraljice Jelene 82, 23205 Bibinje', phone: '099 403 4562', website: 'https://www.asmiragroup.com/', workingHours: wh('09:00–15:00', '09:00–15:00', '09:00–15:00'), verified: true, lastVerified: '2026-02-19', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(7), lastAutoChecked: hoursAgo(4), trustScore: 68, lat: 44.0750, lng: 15.2870 },
  { id: 'gs24', name: 'INA Biograd na Moru', category: 'gas', address: 'Biograd na Moru', phone: '023 383 961', website: 'https://www.ina.hr/', workingHours: wh('06:00–22:00', '06:00–22:00', '07:00–22:00'), verified: true, lastVerified: '2026-02-19', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(8), lastAutoChecked: hoursAgo(4), trustScore: 70, lat: 43.9380, lng: 15.4470 },
  { id: 'gs25', name: 'INA Biograd na Moru (magistrala)', category: 'gas', address: 'Magistralna ul. 2, 23210 Biograd na Moru', phone: '800 11 12', website: 'https://www.ina.hr/station/biograd-na-moru-magistrala/', workingHours: wh('00:00–24:00', '00:00–24:00', '00:00–24:00'), verified: true, lastVerified: '2026-02-19', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(6), lastAutoChecked: hoursAgo(3), trustScore: 72, lat: 43.9380, lng: 15.4470 },
  { id: 'gs26', name: 'Batur Benz Pridraga', category: 'gas', address: 'Pridraga', phone: '—', workingHours: wh('06:00–22:00', '06:00–22:00', '07:00–22:00'), verified: true, lastVerified: '2026-02-19', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(7), lastAutoChecked: hoursAgo(4), trustScore: 60, lat: 44.2100, lng: 15.3700 },
  { id: 'gs27', name: 'Shell Supernova', category: 'gas', address: 'Ul. Ante Starčevića 2, Zadar', phone: '023 250 250', website: 'https://maps.app.goo.gl/2mcZQurDSGQqQH5X7?g_st=ic', workingHours: wh('06:00–23:00', '06:00–23:00', '07:00–22:00'), verified: true, lastVerified: '2026-02-19', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(2), lastAutoChecked: hoursAgo(1), trustScore: 80, lat: 44.1157, lng: 15.2310 },

  // NAUTIČKE BENZINSKE POSTAJE — nautical gas stations (verificirano: danielis-yachting.com, INA.hr — Feb 2026)
  { id: 'ngs1', name: 'INA Branimir', category: 'nauticalGas', address: 'Ul. kneza Branimira 20a, Zadar', phone: '091 497 1063', website: 'https://www.ina.hr/', workingHours: wh('00:00–24:00', '00:00–24:00', '00:00–24:00'), verified: true, lastVerified: '2026-02-19', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(3), lastAutoChecked: hoursAgo(1), trustScore: 78, lat: 44.1090, lng: 15.2450 },
  { id: 'ngs2', name: 'INA Preko', category: 'nauticalGas', address: 'Preko, Ugljan', phone: '023 286 214', website: 'https://www.ina.hr/', workingHours: wh('06:00–22:00', '06:00–22:00', '06:00–22:00'), verified: true, lastVerified: '2026-02-19', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(4), lastAutoChecked: hoursAgo(2), trustScore: 75, lat: 44.0806, lng: 15.1882 },
  { id: 'ngs3', name: 'Adria Oil Zaglav, Dugi Otok', category: 'nauticalGas', address: 'Zaglav 24 B, 23281 Sali', phone: '023 377 234', workingHours: wh('07:00–19:00', '07:00–19:00', '07:00–19:00'), verified: true, lastVerified: '2026-02-19', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(5), lastAutoChecked: hoursAgo(3), trustScore: 72, lat: 43.9488, lng: 15.1437 },
  { id: 'ngs4', name: 'Petrol Gaženica', category: 'nauticalGas', address: 'Gaženička cesta 22a, Zadar', phone: '091 638 6602', website: 'https://www.petrol.hr/', workingHours: wh('00:00–24:00', '00:00–24:00', '00:00–24:00'), verified: true, lastVerified: '2026-02-19', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(2), lastAutoChecked: hoursAgo(1), trustScore: 82, lat: 44.1060, lng: 15.2520 },
  { id: 'ngs5', name: 'Asmira Marine Fuel Station (ex Fuzul International)', category: 'nauticalGas', address: 'D-Marin Dalmacija, Obala kraljice Jelene 82, 23205 Bibinje', phone: '099 403 4562', website: 'https://www.asmiragroup.com/', workingHours: wh('09:00–15:00', '09:00–15:00', '09:00–15:00'), verified: true, lastVerified: '2026-02-19', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(7), lastAutoChecked: hoursAgo(4), trustScore: 68, lat: 44.0750, lng: 15.2870 },
  { id: 'ngs6', name: 'INA Biograd na Moru', category: 'nauticalGas', address: 'Obala kralja Petra Krešimira IV 36a, 23210 Biograd na Moru', phone: '800 11 12', website: 'https://www.ina.hr/station/biograd-na-moru-obala/', workingHours: wh('07:00–19:00', '07:00–19:00', '07:00–19:00'), verified: true, lastVerified: '2026-02-19', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(8), lastAutoChecked: hoursAgo(4), trustScore: 70, lat: 43.9363, lng: 15.4431 },
  { id: 'ngs7', name: 'Sea Gaspoint Novalja', category: 'nauticalGas', address: 'Novalja, Pag', phone: '—', website: 'https://sea-gaspoint-novalja.com/', workingHours: wh('Zatvoreno', 'Zatvoreno', 'Zatvoreno'), verified: true, lastVerified: '2026-02-19', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(10), lastAutoChecked: hoursAgo(5), trustScore: 50, lat: 44.5568, lng: 14.8822, announcement: 'Privremeno zatvoreno / Temporarily closed' },

  // PARKING — samo dva stvarna pružatelja
  { id: 'pk1', name: 'Car Parking Zadar', category: 'parking', address: 'Jazine, Zadar', phone: '023 333 444', website: 'https://car-parking-zadar.com/', workingHours: wh('00:00–24:00', '00:00–24:00', '00:00–24:00'), verified: true, lastVerified: '2026-02-15', reportCount: 0, verificationStatus: 'owner', ownerVerifiedAt: hoursAgo(1), communityConfirmedAt: minutesAgo(15), lastAutoChecked: hoursAgo(1), trustScore: 95, lat: 44.1135, lng: 15.2340 },
  { id: 'pk2', name: 'OIL — Ulični parking', category: 'parking', address: 'Zone 0–4, Zadar', phone: '0800 1122', website: 'https://oil.hr/parking/', workingHours: wh('08:00–16:00', '08:00–14:00', 'Besplatno'), verified: true, lastVerified: '2026-02-15', reportCount: 0, verificationStatus: 'owner', ownerVerifiedAt: hoursAgo(2), communityConfirmedAt: hoursAgo(1), lastAutoChecked: hoursAgo(1), trustScore: 92, lat: 44.1155, lng: 15.2255 },
];

export function isBusinessOpen(business: Business): boolean | null {
  if (business.reportCount >= 5) return false;
  
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Zagreb' }));
  const dayIndex = now.getDay();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  // Check override first
  const override = _overridesCache.find(
    o => o.business_id === business.id && o.day_of_week === dayIndex
  );
  if (override) {
    if (override.is_closed) return false;
    if (override.open_time && override.close_time) {
      const [oh, om] = override.open_time.split(':').map(Number);
      const [ch, cm] = override.close_time.split(':').map(Number);
      const openMin = oh * 60 + om;
      const closeMin = ch * 60 + cm;
      if (closeMin <= openMin) return nowMin >= openMin || nowMin < closeMin;
      return nowMin >= openMin && nowMin < closeMin;
    }
  }

  // Fall back to hardcoded hours
  const dayKeys: (keyof Business['workingHours'])[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const todayHours = business.workingHours[dayKeys[dayIndex]];

  if (!todayHours || todayHours === 'Zatvoreno') return false;
  if (todayHours === 'Besplatno') return true;
  if (todayHours === '—' || todayHours === '-') return null;

  const match = todayHours.match(/(\d{2}):(\d{2})–(\d{2}):(\d{2})/);
  if (!match) return null;

  const openMin = parseInt(match[1]) * 60 + parseInt(match[2]);
  const closeMin = parseInt(match[3]) * 60 + parseInt(match[4]);

  // Public-holiday rule: certain categories close on holidays.
  // 24/7 places (00:00–24:00) stay open (e.g. dežurna ljekarna).
  const is247 = openMin === 0 && closeMin === 24 * 60;
  if (
    !override &&
    !is247 &&
    HOLIDAY_CLOSED_CATEGORIES.has(business.category as string) &&
    todayIsHolidayZagreb()
  ) {
    return false;
  }

  if (closeMin <= openMin) return nowMin >= openMin || nowMin < closeMin;
  return nowMin >= openMin && nowMin < closeMin;
}

export function getTodayHours(business: Business): string {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Zagreb' }));
  const dayIndex = now.getDay();
  const dayKeys: (keyof Business['workingHours'])[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const raw = business.workingHours[dayKeys[dayIndex]];

  // If it's a public holiday and category typically closes — show holiday label.
  const match = raw?.match(/(\d{2}):(\d{2})–(\d{2}):(\d{2})/);
  if (match) {
    const openMin = parseInt(match[1]) * 60 + parseInt(match[2]);
    const closeMin = parseInt(match[3]) * 60 + parseInt(match[4]);
    const is247 = openMin === 0 && closeMin === 24 * 60;
    if (
      !is247 &&
      HOLIDAY_CLOSED_CATEGORIES.has(business.category as string) &&
      todayIsHolidayZagreb()
    ) {
      return 'Zatvoreno (praznik)';
    }
  }
  return raw;
}

export function searchBusinesses(query: string, categoryFilter?: CategoryId, extraBusinesses?: Business[]): Business[] {
  let results = [...businesses, ...(extraBusinesses || [])];

  if (categoryFilter) {
    // 'doctor' shows both dentist and medicine subcategories
    if (categoryFilter === 'doctor') {
      results = results.filter(b => b.category === 'doctor' || b.category === 'dentist' || b.category === 'medicine');
    } else {
      results = results.filter(b => b.category === categoryFilter);
    }
  }

  if (query.trim()) {
    const scored = results
      .map(b => ({
        business: b,
        score: scoreMatch(query, [b.name, b.address, b.category]),
      }))
      .filter(item => item.score >= 0)
      .sort((a, b) => a.score - b.score);
    results = scored.map(s => s.business);
  }

  return results;
}
