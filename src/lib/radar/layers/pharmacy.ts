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
      .filter(p => p.lat != null && p.lng != null && (p.category === 'pharmacy' || p.category === 'medicine'))
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
