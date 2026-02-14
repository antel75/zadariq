import { Business, EmergencyContact, CategoryId, VerificationStatus } from './types';
import { scoreMatch } from '@/lib/fuzzySearch';

export const categories: { id: CategoryId; icon: string; labelKey: string }[] = [
  { id: 'pharmacy', icon: 'Pill', labelKey: 'category.pharmacy' },
  { id: 'doctor', icon: 'Stethoscope', labelKey: 'category.doctor' },
  { id: 'dentist', icon: 'Stethoscope', labelKey: 'category.dentist' },
  { id: 'medicine', icon: 'Stethoscope', labelKey: 'category.medicine' },
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
  { id: 'ph1', name: 'Ljekarna Donat', category: 'pharmacy', address: 'Široka ulica 2, Zadar', phone: '023 212 350', workingHours: wh('07:00–20:00', '07:00–14:00', 'Zatvoreno'), verified: true, lastVerified: '2026-02-10', reportCount: 0, verificationStatus: 'owner', ownerVerifiedAt: minutesAgo(18), communityConfirmedAt: hoursAgo(2), lastAutoChecked: hoursAgo(4), trustScore: 92, occupancy: 'normal', waitTime: '~5 min', dailyOffer: '20% popusta na vitamine', announcement: 'Dostupno testiranje za gripu', analytics: { viewsToday: 124, callsClicked: 18, navigationClicks: 32 }, featured: true },
  { id: 'ph2', name: 'Ljekarna Liburnska', category: 'pharmacy', address: 'Liburnska obala 6, Zadar', phone: '023 250 350', workingHours: wh('07:30–20:00', '08:00–14:00', 'Zatvoreno'), verified: true, lastVerified: '2026-02-12', reportCount: 0, verificationStatus: 'owner', ownerVerifiedAt: hoursAgo(3), communityConfirmedAt: hoursAgo(6), lastAutoChecked: hoursAgo(5), trustScore: 88, occupancy: 'quiet', analytics: { viewsToday: 67, callsClicked: 9, navigationClicks: 14 } },
  { id: 'ph3', name: 'Ljekarna Centar', category: 'pharmacy', address: 'Jurja Barakovića 4, Zadar', phone: '023 302 400', workingHours: wh('08:00–20:00', '08:00–13:00', 'Zatvoreno'), verified: false, lastVerified: '2026-01-20', reportCount: 1, verificationStatus: 'community', communityConfirmedAt: daysAgo(2), lastAutoChecked: hoursAgo(8), trustScore: 55 },
  { id: 'ph4', name: 'Ljekarna Bili Brig', category: 'pharmacy', address: 'Put Dikla 4, Zadar', phone: '023 331 200', workingHours: wh('07:00–21:00', '07:00–15:00', '08:00–13:00'), verified: true, lastVerified: '2026-02-08', reportCount: 0, verificationStatus: 'owner', ownerVerifiedAt: hoursAgo(12), communityConfirmedAt: hoursAgo(1), lastAutoChecked: hoursAgo(3), trustScore: 85, occupancy: 'busy', waitTime: '~15 min', analytics: { viewsToday: 89, callsClicked: 12, navigationClicks: 21 } },
  { id: 'ph5', name: 'Ljekarna Arbanasi', category: 'pharmacy', address: 'Ul. Franje Tuđmana 20, Zadar', phone: '023 260 100', workingHours: wh('08:00–20:00', '08:00–14:00', 'Zatvoreno'), verified: false, lastVerified: '2026-01-15', reportCount: 4, verificationStatus: 'possibly_incorrect', communityConfirmedAt: daysAgo(10), lastAutoChecked: daysAgo(2), trustScore: 18 },
  { id: 'ph6', name: 'Ljekarna Jazine', category: 'pharmacy', address: 'Poljana Natka Nodila 3, Zadar', phone: '023 314 500', workingHours: wh('07:00–20:00', '07:00–14:00', 'Zatvoreno'), verified: true, lastVerified: '2026-02-13', reportCount: 0, verificationStatus: 'owner', ownerVerifiedAt: minutesAgo(45), communityConfirmedAt: hoursAgo(1), lastAutoChecked: hoursAgo(2), trustScore: 95, occupancy: 'quiet', dailyOffer: 'Besplatno mjerenje tlaka', analytics: { viewsToday: 156, callsClicked: 22, navigationClicks: 45 }, featured: true },
  { id: 'ph7', name: 'Ljekarna Borik', category: 'pharmacy', address: 'Majstora Radovana 7, Zadar', phone: '023 332 100', workingHours: wh('08:00–19:00', '08:00–13:00', 'Zatvoreno'), verified: false, lastVerified: '2026-01-28', reportCount: 0, verificationStatus: 'unverified', lastAutoChecked: daysAgo(3), trustScore: 35 },
  { id: 'ph8', name: 'Ljekarna Poluotok', category: 'pharmacy', address: 'Kalelarga bb, Zadar', phone: '023 211 600', workingHours: wh('07:30–20:30', '08:00–15:00', '09:00–13:00'), verified: true, lastVerified: '2026-02-11', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: minutesAgo(30), lastAutoChecked: hoursAgo(6), trustScore: 72 },
  { id: 'ph9', name: 'Ljekarna Plovanija', category: 'pharmacy', address: 'Ante Starčevića 1, Zadar', phone: '023 315 800', workingHours: wh('08:00–20:00', '08:00–14:00', 'Zatvoreno'), verified: false, lastVerified: '2025-12-20', reportCount: 3, verificationStatus: 'possibly_incorrect', communityConfirmedAt: daysAgo(15), lastAutoChecked: daysAgo(1), trustScore: 22 },
  { id: 'ph10', name: 'Ljekarna Voštarnica', category: 'pharmacy', address: 'Stjepana Radića 15, Zadar', phone: '023 340 200', workingHours: wh('07:30–19:30', '08:00–13:00', 'Zatvoreno'), verified: true, lastVerified: '2026-02-09', reportCount: 0, verificationStatus: 'owner', ownerVerifiedAt: hoursAgo(6), communityConfirmedAt: hoursAgo(2), lastAutoChecked: hoursAgo(1), trustScore: 90 },

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

  // RESTAURANTS (real data from Citybook Zadar)
  { id: 'rs1', name: 'Restaurant Groppo', category: 'restaurants', address: 'Široka ulica 22, Zadar', phone: '023 778 981', website: 'https://www.restaurant-groppo.com/', workingHours: wh('12:00–23:00', '12:00–23:00', '12:00–22:00'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(4), lastAutoChecked: hoursAgo(2), trustScore: 75, lat: 44.1155, lng: 15.2249 },
  { id: 'rs2', name: 'Restaurant The Taste', category: 'restaurants', address: 'Poljana Šime Budinića 2, Zadar', phone: '095 808 8966', website: 'https://taste.com.hr/', workingHours: wh('12:00–23:00', '12:00–23:00', '12:00–22:00'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(6), lastAutoChecked: hoursAgo(3), trustScore: 72, lat: 44.1148, lng: 15.2220 },
  { id: 'rs3', name: 'Konoba Stomorica', category: 'restaurants', address: 'Stomorica ulica 5, Zadar', phone: '099 448 3694', workingHours: wh('11:00–23:00', '11:00–23:00', '11:00–22:00'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(3), lastAutoChecked: hoursAgo(1), trustScore: 78, lat: 44.1147, lng: 15.2250 },
  { id: 'rs4', name: 'Restaurant Bruschetta', category: 'restaurants', address: 'Mihovila Pavlinovića 12, Zadar', phone: '023 312 915', website: 'https://www.bruschetta.hr/', workingHours: wh('11:00–23:00', '11:00–23:00', '12:00–22:00'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(5), lastAutoChecked: hoursAgo(2), trustScore: 74, lat: 44.1139, lng: 15.2246 },
  { id: 'rs5', name: 'Restaurant Eat Me', category: 'restaurants', address: 'Dalmatinskog Sabora 2, Zadar', phone: '023 778 981', website: 'https://eatme.com.hr/', workingHours: wh('12:00–23:00', '12:00–23:00', '12:00–22:00'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(7), lastAutoChecked: hoursAgo(3), trustScore: 70, lat: 44.1152, lng: 15.2241 },
  { id: 'rs6', name: 'Restaurant Bueno', category: 'restaurants', address: 'Ulica Brne Karnarutića 12, Zadar', phone: '099 769 8424', website: 'https://bueno.com.hr/', workingHours: wh('11:00–23:00', '11:00–23:00', '12:00–22:00'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(4), lastAutoChecked: hoursAgo(2), trustScore: 73, lat: 44.1140, lng: 15.2235 },
  { id: 'rs7', name: 'Konoba Skoblar', category: 'restaurants', address: 'Trg Petra Zoranića 3, Zadar', phone: '023 213 236', website: 'https://konoba-skoblar.eatbu.hr/', workingHours: wh('10:00–23:00', '10:00–23:00', '10:00–22:00'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(2), lastAutoChecked: hoursAgo(1), trustScore: 76, lat: 44.1145, lng: 15.2254 },

  // CAFES & BARS (real data from Citybook Zadar)
  { id: 'cf1', name: 'Caffe bar Kult', category: 'cafes', address: 'Stomorica 6a, Zadar', phone: '091 333 3140', workingHours: wh('07:00–23:00', '08:00–23:00', '09:00–22:00'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(3), lastAutoChecked: hoursAgo(2), trustScore: 70, lat: 44.1147, lng: 15.2252 },
  { id: 'cf2', name: 'Winehouse Fiolić', category: 'cafes', address: 'Kožinska cesta 62, Kožino', phone: '098 891 017', website: 'http://www.popij.me/', workingHours: wh('16:00–23:00', '12:00–23:00', '12:00–22:00'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(5), lastAutoChecked: hoursAgo(3), trustScore: 68, lat: 44.1350, lng: 15.1980 },
  { id: 'cf3', name: 'Winegarden', category: 'cafes', address: 'Pod bedemom 1A, Zadar', phone: '098 891 017', website: 'https://winegarden.com.hr/', workingHours: wh('10:00–23:00', '10:00–23:00', '10:00–22:00'), verified: true, lastVerified: '2026-02-14', reportCount: 0, verificationStatus: 'community', communityConfirmedAt: hoursAgo(4), lastAutoChecked: hoursAgo(2), trustScore: 72, lat: 44.1150, lng: 15.2258 },

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
