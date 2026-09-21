import { supabase } from '@/integrations/supabase/client';
import { PinStatus, RadarLayer, RadarPin } from '../types';

function evStatus(status: string): PinStatus {
  if (status === 'working' || status === 'available') return 'open';
  if (status === 'busy' || status === 'occupied') return 'closing-soon';
  if (status === 'broken' || status === 'offline') return 'closed';
  return 'unknown';
}

export const evLayer: RadarLayer = {
  id: 'ev',
  label: { hr: 'EV punjači', en: 'EV chargers' },
  icon: '🔌',
  color: '#10b981',
  defaultOn: false,
  async load() {
    const { data } = await supabase
      .from('ev_chargers')
      .select('id, name, address, lat, lng, power_kw, plug_count, status, operator');

    return (data || []).map((c: any): RadarPin => ({
      id: `ev:${c.id}`,
      layerId: 'ev',
      sourceId: c.id,
      name: c.name || c.operator || 'EV punjač',
      address: c.address || '',
      lat: c.lat,
      lng: c.lng,
      status: evStatus(c.status),
      subtitle: [c.power_kw ? `${c.power_kw} kW` : null, c.plug_count ? `${c.plug_count}×` : null]
        .filter(Boolean)
        .join(' · '),
      detailPath: '/ev-chargers',
    }));
  },
};
