import { supabase } from '@/integrations/supabase/client';
import { RadarLayer } from '../types';
import { loadAllPlaces, placeToPin } from '../places';

function todayZagreb(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Zagreb',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-zčćžšđ0-9]/gi, '');
}

/** Coordinates for catalogue pharmacies (geocoded from addresses). */
const PHARMACY_COORDS: Record<string, [number, number]> = {
  ph1: [44.10882, 15.23883], ph2: [44.1152, 15.2265], ph3: [44.1138, 15.22644],
  ph4: [44.12881, 15.23092], ph5: [44.1386, 15.24158], ph6: [44.11096, 15.23782],
  ph7: [44.1133, 15.235], ph8: [44.10465, 15.24924], ph9: [44.12556, 15.23389],
  ph10: [44.13648, 15.22083], ph11: [44.1135, 15.2358], ph12: [44.121, 15.244],
  ph13: [44.11227, 15.25326], ph14: [44.0694, 15.2843], ph15: [44.12191, 15.25828],
  ph16: [44.12038, 15.251], ph17: [44.1105, 15.242],
};

export const pharmacyLayer: RadarLayer = {
  id: 'pharmacy',
  label: { hr: 'Ljekarne', en: 'Pharmacies' },
  icon: '💊',
  color: '#0ea5e9',
  defaultOn: false,
  async load() {
    const today = todayZagreb();
    const [places, duty] = await Promise.all([
      loadAllPlaces(),
      supabase
        .from('duty_services')
        .select('name, address, phone')
        .eq('type', 'pharmacy')
        .eq('enabled', true)
        .lte('valid_from', today)
        .gte('valid_until', today),
    ]);

    const dutyNames = (duty.data || []).map((d: any) => normalize(d.name || ''));

    return places
      .filter(p => p.category === 'pharmacy' || p.category === 'medicine')
      .map(p => (p.lat == null && PHARMACY_COORDS[p.id] ? { ...p, lat: PHARMACY_COORDS[p.id][0], lng: PHARMACY_COORDS[p.id][1] } : p))
      .filter(p => p.lat != null && p.lng != null)
      .map(p => {
        const pin = placeToPin(p, 'pharmacy');
        const isDuty = dutyNames.some(n => n && (n.includes(normalize(p.name)) || normalize(p.name).includes(n)));
        if (isDuty) {
          pin.status = 'duty';
          pin.subtitle = `Dežurna · ${pin.subtitle || ''}`.trim();
        }
        return pin;
      });
  },
};
