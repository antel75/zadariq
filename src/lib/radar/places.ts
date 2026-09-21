import { supabase } from '@/integrations/supabase/client';
import { businesses, isBusinessOpen, getTodayHours, loadHoursOverrides } from '@/data/mockData';
import { Business } from '@/data/types';
import { PinStatus, RadarPin } from './types';

let _placesCache: Business[] | null = null;
let _placesFetchedAt = 0;

const DEFAULT_HOURS_BY_CATEGORY: Record<string, Business['workingHours']> = {
  cafes: { mon: '07:00–23:00', tue: '07:00–23:00', wed: '07:00–23:00', thu: '07:00–23:00', fri: '07:00–23:00', sat: '07:00–23:00', sun: '08:00–23:00' },
  shops: { mon: '08:00–20:00', tue: '08:00–20:00', wed: '08:00–20:00', thu: '08:00–20:00', fri: '08:00–20:00', sat: '08:00–14:00', sun: '—' },
  restaurants: { mon: '11:00–23:00', tue: '11:00–23:00', wed: '11:00–23:00', thu: '11:00–23:00', fri: '11:00–23:00', sat: '11:00–23:00', sun: '11:00–23:00' },
};

const EMPTY_HOURS: Business['workingHours'] = { mon: '—', tue: '—', wed: '—', thu: '—', fri: '—', sat: '—', sun: '—' };

/**
 * All known places: the static catalogue plus community-approved places.
 * Cached for 5 minutes so several layers can share a single fetch.
 */
export async function loadAllPlaces(): Promise<Business[]> {
  if (_placesCache && Date.now() - _placesFetchedAt < 5 * 60 * 1000) return _placesCache;

  await loadHoursOverrides();
  const { data } = await supabase
    .from('pending_places')
    .select('id, proposed_name, proposed_address, category, phone, website, lat, lng, reviewed_at, created_at')
    .eq('status', 'approved');

  const approved: Business[] = (data || []).map((p: any) => {
    const cat = (p.category as Business['category']) || 'cafes';
    return {
      id: `ap_${p.id}`,
      name: p.proposed_name,
      category: cat,
      address: p.proposed_address || '',
      phone: p.phone || '',
      website: p.website || undefined,
      workingHours: DEFAULT_HOURS_BY_CATEGORY[cat as string] || EMPTY_HOURS,
      verified: false,
      lastVerified: p.reviewed_at || p.created_at,
      reportCount: 0,
      verificationStatus: 'community',
      trustScore: 45,
      lat: p.lat ?? undefined,
      lng: p.lng ?? undefined,
    };
  });

  _placesCache = [...businesses, ...approved];
  _placesFetchedAt = Date.now();
  return _placesCache;
}

function zagrebNowMinutes(): number {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Zagreb' }));
  return now.getHours() * 60 + now.getMinutes();
}

/** Open / closing soon (< 60 min left) / closed / unknown */
export function placeStatus(business: Business): PinStatus {
  const open = isBusinessOpen(business);
  if (open === null) return 'unknown';
  if (!open) return 'closed';

  const hours = getTodayHours(business);
  const match = hours?.match(/(\d{2}):(\d{2})–(\d{2}):(\d{2})/);
  if (match) {
    const closeMin = parseInt(match[3]) * 60 + parseInt(match[4]);
    const left = closeMin - zagrebNowMinutes();
    if (left > 0 && left <= 60) return 'closing-soon';
  }
  return 'open';
}

export function placeToPin(business: Business, layerId: string, subtitle?: string): RadarPin {
  return {
    id: `${layerId}:${business.id}`,
    layerId,
    sourceId: business.id,
    name: business.name,
    address: business.address,
    lat: business.lat ?? null,
    lng: business.lng ?? null,
    status: placeStatus(business),
    subtitle: subtitle ?? getTodayHours(business),
    phone: business.phone || null,
    detailPath: `/business/${business.id}`,
    draggableId: business.id.startsWith('ap_') ? business.id.replace(/^ap_/, '') : null,
  };
}

export function hasCoords(pin: RadarPin): boolean {
  return pin.lat != null && pin.lng != null;
}
