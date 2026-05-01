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

  // ZUBARI i OBITELJSKA MEDICINA — sada u DB tablici health_places, admin upravlja
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
