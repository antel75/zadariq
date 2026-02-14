import { Business, EmergencyContact, CategoryId, VerificationStatus } from './types';

export const categories: { id: CategoryId; icon: string; labelKey: string }[] = [
  { id: 'pharmacy', icon: 'Pill', labelKey: 'category.pharmacy' },
  { id: 'doctor', icon: 'Stethoscope', labelKey: 'category.doctor' },
  { id: 'shops', icon: 'ShoppingBag', labelKey: 'category.shops' },
  { id: 'restaurants', icon: 'UtensilsCrossed', labelKey: 'category.restaurants' },
  { id: 'cafes', icon: 'Coffee', labelKey: 'category.cafes' },
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
  // PHARMACIES
  { id: 'ph1', name: 'Ljekarna Donat', category: 'pharmacy', address: 'Široka ulica 2, Zadar', phone: '023 212 350', workingHours: wh('07:00–20:00', '07:00–14:00', 'Zatvoreno'), verified: true, lastVerified: '2026-02-10', reportCount: 0, verificationStatus: 'owner', ownerVerifiedAt: minutesAgo(18), communityConfirmedAt: hoursAgo(2), lastAutoChecked: hoursAgo(4), trustScore: 92 },
  { id: 'ph2', name: 'Ljekarna Liburnska', category: 'pharmacy', address: 'Liburnska obala 6, Zadar', phone: '023 250 350', workingHours: wh('07:30–20:00', '08:00–14:00', 'Zatvoreno'), verified: true, lastVerified: '2026-02-12', reportCount: 0, verificationStatus: 'owner', ownerVerifiedAt: hoursAgo(3), communityConfirmedAt: hoursAgo(6), lastAutoChecked: hoursAgo(5), trustScore: 88 },
  { id: 'ph3', name: 'Ljekarna Centar', category: 'pharmacy', address: 'Jurja Barakovića 4, Zadar', phone: '023 302 400', workingHours: wh('08:00–20:00', '08:00–13:00', 'Zatvoreno'), verified: false, lastVerified: '2026-01-20', reportCount: 1, verificationStatus: 'community', communityConfirmedAt: daysAgo(2), lastAutoChecked: hoursAgo(8), trustScore: 55 },
  { id: 'ph4', name: 'Ljekarna Bili Brig', category: 'pharmacy', address: 'Put Dikla 4, Zadar', phone: '023 331 200', workingHours: wh('07:00–21:00', '07:00–15:00', '08:00–13:00'), verified: true, lastVerified: '2026-02-08', reportCount: 0, verificationStatus: 'owner', ownerVerifiedAt: hoursAgo(12), communityConfirmedAt: hoursAgo(1), lastAutoChecked: hoursAgo(3), trustScore: 85 },
  { id: 'ph5', name: 'Ljekarna Arbanasi', category: 'pharmacy', address: 'Ul. Franje Tuđmana 20, Zadar', phone: '023 260 100', workingHours: wh('08:00–20:00', '08:00–14:00', 'Zatvoreno'), verified: false, lastVerified: '2026-01-15', reportCount: 4, verificationStatus: 'possibly_incorrect', communityConfirmedAt: daysAgo(10), lastAutoChecked: daysAgo(2), trustScore: 18 },
  { id: 'ph6', name: 'Ljekarna Jazine', category: 'pharmacy', address: 'Poljana Natka Nodila 3, Zadar', phone: '023 314 500', workingHours: wh('07:00–20:00', '07:00–14:00', 'Zatvoreno'), verified: true, lastVerified: '2026-02-13', reportCount: 0, verificationStatus: 'owner', ownerVerifiedAt: minutesAgo(45), communityConfirmedAt: hoursAgo(1), lastAutoChecked: hoursAgo(2), trustScore: 95 },
  { id: 'ph7', name: 'Ljekarna Borik', category: 'pharmacy', address: 'Majstora Radovana 7, Zadar', phone: '023 332 100', workingHours: wh('08:00–19:00', '08:00–13:00', 'Zatvoreno'), verified: false, lastVerified: '2026-01-28', reportCount: 0, verificationStatus: 'unverified', lastAutoChecked: daysAgo(3), trustScore: 35 },
  { id: 'ph8', name: 'Ljekarna Poluotok', category: 'pharmacy', address: 'Kalelarga bb, Zadar', phone: '023 211 600', workingHours: wh('07:30–20:30', '08:00–15:00', '09:00–13:00'), verified: true, lastVerified: '2026-02-11', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: minutesAgo(30), lastAutoChecked: hoursAgo(6), trustScore: 72 },
  { id: 'ph9', name: 'Ljekarna Plovanija', category: 'pharmacy', address: 'Ante Starčevića 1, Zadar', phone: '023 315 800', workingHours: wh('08:00–20:00', '08:00–14:00', 'Zatvoreno'), verified: false, lastVerified: '2025-12-20', reportCount: 3, verificationStatus: 'possibly_incorrect', communityConfirmedAt: daysAgo(15), lastAutoChecked: daysAgo(1), trustScore: 22 },
  { id: 'ph10', name: 'Ljekarna Voštarnica', category: 'pharmacy', address: 'Stjepana Radića 15, Zadar', phone: '023 340 200', workingHours: wh('07:30–19:30', '08:00–13:00', 'Zatvoreno'), verified: true, lastVerified: '2026-02-09', reportCount: 0, verificationStatus: 'owner', ownerVerifiedAt: hoursAgo(6), communityConfirmedAt: hoursAgo(2), lastAutoChecked: hoursAgo(1), trustScore: 90 },

  // DENTISTS
  { id: 'dr1', name: 'Dental Studio Zadar', category: 'doctor', address: 'Ulica Kneza Branimira 14, Zadar', phone: '023 316 200', workingHours: wh('08:00–16:00', '08:00–12:00', 'Zatvoreno'), verified: true, lastVerified: '2026-02-10', reportCount: 0, verificationStatus: 'owner', ownerVerifiedAt: hoursAgo(5), communityConfirmedAt: hoursAgo(3), lastAutoChecked: hoursAgo(2), trustScore: 88 },
  { id: 'dr2', name: 'Ordinacija dr. Kovač', category: 'doctor', address: 'Obala kneza Trpimira 10, Zadar', phone: '023 250 800', workingHours: wh('09:00–17:00', 'Zatvoreno', 'Zatvoreno'), verified: true, lastVerified: '2026-02-05', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(8), lastAutoChecked: hoursAgo(4), trustScore: 68 },
  { id: 'dr3', name: 'Stomatologija Petrić', category: 'doctor', address: 'Put Dikla 22, Zadar', phone: '023 337 100', workingHours: wh('08:00–15:00', '09:00–12:00', 'Zatvoreno'), verified: false, lastVerified: '2026-01-18', reportCount: 2, verificationStatus: 'unverified', lastAutoChecked: daysAgo(2), trustScore: 28 },
  { id: 'dr4', name: 'Dental Centar Zadar', category: 'doctor', address: 'Varoška ulica 3, Zadar', phone: '023 212 900', workingHours: wh('07:30–19:00', '08:00–13:00', 'Zatvoreno'), verified: true, lastVerified: '2026-02-12', reportCount: 0, verificationStatus: 'owner', ownerVerifiedAt: minutesAgo(90), communityConfirmedAt: hoursAgo(1), lastAutoChecked: hoursAgo(3), trustScore: 91 },
  { id: 'dr5', name: 'Ordinacija dr. Babić', category: 'doctor', address: 'Ulica Zrinsko-Frankopanska 8, Zadar', phone: '023 303 600', workingHours: wh('08:00–16:00', 'Zatvoreno', 'Zatvoreno'), verified: false, lastVerified: '2026-01-22', reportCount: 0, verificationStatus: 'unverified', lastAutoChecked: daysAgo(5), trustScore: 32 },
  { id: 'dr6', name: 'Zadar Dental Clinic', category: 'doctor', address: 'Poljana Šime Budinića 1, Zadar', phone: '023 400 200', workingHours: wh('08:00–20:00', '09:00–14:00', 'Zatvoreno'), verified: true, lastVerified: '2026-02-13', reportCount: 0, verificationStatus: 'owner', ownerVerifiedAt: hoursAgo(2), communityConfirmedAt: minutesAgo(45), lastAutoChecked: hoursAgo(1), trustScore: 94 },
  { id: 'dr7', name: 'Ordinacija dr. Matić', category: 'doctor', address: 'Ul. Božidara Petranovića 6, Zadar', phone: '023 215 400', workingHours: wh('09:00–17:00', '09:00–12:00', 'Zatvoreno'), verified: false, lastVerified: '2026-01-10', reportCount: 5, verificationStatus: 'possibly_incorrect', communityConfirmedAt: daysAgo(20), lastAutoChecked: daysAgo(3), trustScore: 12 },
  { id: 'dr8', name: 'DentaVita Zadar', category: 'doctor', address: 'Ulica Augusta Šenoe 12, Zadar', phone: '023 320 700', workingHours: wh('08:00–18:00', '08:00–12:00', 'Zatvoreno'), verified: true, lastVerified: '2026-02-07', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(4), lastAutoChecked: hoursAgo(6), trustScore: 65 },
  { id: 'dr9', name: 'Poliklinika Zubić vila', category: 'doctor', address: 'Kraljice Jelene 5, Zadar', phone: '023 335 900', workingHours: wh('07:00–19:00', '08:00–14:00', '09:00–12:00'), verified: true, lastVerified: '2026-02-11', reportCount: 0, verificationStatus: 'owner', ownerVerifiedAt: hoursAgo(1), communityConfirmedAt: minutesAgo(20), lastAutoChecked: hoursAgo(2), trustScore: 96 },
  { id: 'dr10', name: 'Ordinacija dr. Jurić', category: 'doctor', address: 'Braće Vranjanina 9, Zadar', phone: '023 260 300', workingHours: wh('08:00–16:00', 'Zatvoreno', 'Zatvoreno'), verified: false, lastVerified: '2025-12-15', reportCount: 1, verificationStatus: 'unverified', lastAutoChecked: daysAgo(7), trustScore: 25 },

  // CAFES
  { id: 'cf1', name: 'Café Central', category: 'cafes', address: 'Narodni trg 1, Zadar', phone: '023 211 000', workingHours: wh('07:00–23:00', '08:00–23:00', '08:00–22:00'), verified: true, lastVerified: '2026-02-13', reportCount: 0, verificationStatus: 'owner', ownerVerifiedAt: hoursAgo(2), communityConfirmedAt: minutesAgo(30), lastAutoChecked: hoursAgo(1), trustScore: 93 },
  { id: 'cf2', name: 'Garden Lounge', category: 'cafes', address: 'Bedemi zadarskih pobuna bb, Zadar', phone: '023 364 739', workingHours: wh('10:00–01:00', '10:00–01:00', '10:00–23:00'), verified: true, lastVerified: '2026-02-10', reportCount: 0, verificationStatus: 'owner', ownerVerifiedAt: hoursAgo(8), communityConfirmedAt: hoursAgo(3), lastAutoChecked: hoursAgo(4), trustScore: 85 },
  { id: 'cf3', name: 'Caffè Bar Ledana', category: 'cafes', address: 'Perivoj Vladimira Nazora, Zadar', phone: '023 250 600', workingHours: wh('08:00–23:00', '08:00–23:00', '09:00–22:00'), verified: false, lastVerified: '2026-01-25', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: daysAgo(3), lastAutoChecked: hoursAgo(12), trustScore: 52 },
  { id: 'cf4', name: 'Caffè Bar Story', category: 'cafes', address: 'Mihovila Pavlinovića 2, Zadar', phone: '023 300 400', workingHours: wh('07:30–23:00', '08:00–23:00', '09:00–22:00'), verified: true, lastVerified: '2026-02-08', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(6), lastAutoChecked: hoursAgo(3), trustScore: 70 },
  { id: 'cf5', name: 'Kult Caffe', category: 'cafes', address: 'Stomorica 8, Zadar', phone: '023 212 700', workingHours: wh('07:00–22:00', '08:00–22:00', '09:00–21:00'), verified: false, lastVerified: '2026-01-30', reportCount: 1, verificationStatus: 'unverified', lastAutoChecked: daysAgo(4), trustScore: 30 },
  { id: 'cf6', name: 'Barbarella\'s', category: 'cafes', address: 'Obala kralja Petra Krešimira IV 7, Zadar', phone: '023 311 300', workingHours: wh('08:00–24:00', '09:00–24:00', '09:00–23:00'), verified: true, lastVerified: '2026-02-12', reportCount: 0, verificationStatus: 'owner', ownerVerifiedAt: hoursAgo(4), communityConfirmedAt: hoursAgo(1), lastAutoChecked: hoursAgo(2), trustScore: 89 },
  { id: 'cf7', name: 'Café Lovre', category: 'cafes', address: 'Trg Petra Zoranića 2, Zadar', phone: '023 213 500', workingHours: wh('07:00–23:00', '08:00–23:00', '08:00–22:00'), verified: false, lastVerified: '2026-01-20', reportCount: 0, verificationStatus: 'unverified', lastAutoChecked: daysAgo(6), trustScore: 33 },
  { id: 'cf8', name: 'Forum Café', category: 'cafes', address: 'Zeleni trg 2, Zadar', phone: '023 400 100', workingHours: wh('07:00–22:00', '07:30–22:00', '08:00–21:00'), verified: true, lastVerified: '2026-02-09', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(10), lastAutoChecked: hoursAgo(5), trustScore: 62 },
  { id: 'cf9', name: 'Caffe Bar Matrix', category: 'cafes', address: 'Varoška ulica 5, Zadar', phone: '023 316 700', workingHours: wh('07:00–23:00', '08:00–23:00', '09:00–22:00'), verified: false, lastVerified: '2026-01-12', reportCount: 3, verificationStatus: 'possibly_incorrect', communityConfirmedAt: daysAgo(12), lastAutoChecked: daysAgo(1), trustScore: 20 },
  { id: 'cf10', name: 'Sunset Café', category: 'cafes', address: 'Istarska obala 6, Zadar', phone: '023 333 800', workingHours: wh('08:00–24:00', '08:00–24:00', '10:00–23:00'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'owner', ownerVerifiedAt: minutesAgo(10), communityConfirmedAt: minutesAgo(5), lastAutoChecked: hoursAgo(1), trustScore: 97 },

  // PARKING
  { id: 'pk1', name: 'Parking Jazine', category: 'parking', address: 'Jazine, Zadar', phone: '023 305 800', workingHours: wh('00:00–24:00', '00:00–24:00', '00:00–24:00'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'owner', ownerVerifiedAt: hoursAgo(1), communityConfirmedAt: minutesAgo(15), lastAutoChecked: hoursAgo(1), trustScore: 95 },
  { id: 'pk2', name: 'Parking Vau', category: 'parking', address: 'Maraska kompleks, Zadar', phone: '023 305 801', workingHours: wh('00:00–24:00', '00:00–24:00', '00:00–24:00'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'owner', ownerVerifiedAt: hoursAgo(2), communityConfirmedAt: hoursAgo(1), lastAutoChecked: hoursAgo(2), trustScore: 90 },
  { id: 'pk3', name: 'Parking Vijenac', category: 'parking', address: 'Vijenac, Zadar', phone: '023 305 802', workingHours: wh('00:00–24:00', '00:00–24:00', '00:00–24:00'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(4), lastAutoChecked: hoursAgo(3), trustScore: 72 },
  { id: 'pk4', name: 'Parking Ravnice', category: 'parking', address: 'Ravnice, Zadar', phone: '023 305 803', workingHours: wh('06:00–22:00', '06:00–22:00', '06:00–22:00'), verified: false, lastVerified: '2026-01-05', reportCount: 0, verificationStatus: 'unverified', lastAutoChecked: daysAgo(5), trustScore: 30 },
  { id: 'pk5', name: 'Parking Poluotok (Zona 1)', category: 'parking', address: 'Stari grad — ulično parkiranje', phone: '023 305 804', workingHours: wh('07:00–21:00', '07:00–21:00', 'Besplatno'), verified: true, lastVerified: '2026-02-10', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(6), lastAutoChecked: hoursAgo(4), trustScore: 68 },
];

export function isBusinessOpen(business: Business): boolean {
  if (business.reportCount >= 5) return false; // Hide open status for 5+ reports
  
  const now = new Date();
  const dayIndex = now.getDay();
  const dayKeys: (keyof Business['workingHours'])[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const todayHours = business.workingHours[dayKeys[dayIndex]];

  if (!todayHours || todayHours === 'Zatvoreno' || todayHours === 'Besplatno') {
    return todayHours === 'Besplatno';
  }

  const match = todayHours.match(/(\d{2}):(\d{2})–(\d{2}):(\d{2})/);
  if (!match) return false;

  const openMin = parseInt(match[1]) * 60 + parseInt(match[2]);
  const closeMin = parseInt(match[3]) * 60 + parseInt(match[4]);
  const nowMin = now.getHours() * 60 + now.getMinutes();

  if (closeMin <= openMin) {
    return nowMin >= openMin || nowMin < closeMin;
  }
  return nowMin >= openMin && nowMin < closeMin;
}

export function getTodayHours(business: Business): string {
  const dayIndex = new Date().getDay();
  const dayKeys: (keyof Business['workingHours'])[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  return business.workingHours[dayKeys[dayIndex]];
}

export function searchBusinesses(query: string, categoryFilter?: CategoryId): Business[] {
  let results = businesses;

  if (categoryFilter) {
    results = results.filter(b => b.category === categoryFilter);
  }

  if (query.trim()) {
    const q = query.toLowerCase();
    results = results.filter(b =>
      b.name.toLowerCase().includes(q) ||
      b.address.toLowerCase().includes(q) ||
      b.category.toLowerCase().includes(q)
    );
  }

  return results;
}
