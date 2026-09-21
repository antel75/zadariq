import { supabase } from '@/integrations/supabase/client';
import { businesses } from '@/data/mockData';
import { RadarLayer, RadarPin } from '../types';

export interface SundaySourceInfo {
  source: string;
  url: string | null;
  checkedAt: string;
}

/** Filled as a side effect of the last load — the page shows it under the title. */
export let lastSundaySource: SundaySourceInfo | null = null;

function isOpenNowHR(openTime: string, closeTime: string): boolean {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Zagreb' }));
  const [oh, om] = openTime.split(':').map(Number);
  const [ch, cm] = closeTime.split(':').map(Number);
  const cur = now.getHours() * 60 + now.getMinutes();
  return cur >= oh * 60 + om && cur < ch * 60 + cm;
}

function minutesLeft(closeTime: string): number {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Zagreb' }));
  const [ch, cm] = closeTime.split(':').map(Number);
  return ch * 60 + cm - (now.getHours() * 60 + now.getMinutes());
}

export const sundayLayer: RadarLayer = {
  id: 'sunday',
  label: { hr: 'Radna nedjelja', en: 'Sunday' },
  icon: '🛒',
  color: '#22c55e',
  defaultOn: true,
  async load(ctx) {
    const { data } = await supabase
      .from('shop_sunday_schedule')
      .select('*')
      .eq('sunday_date', ctx.sundayDate);

    const entries = data || [];

    const apIds = entries
      .filter(e => e.business_id.startsWith('ap_'))
      .map(e => e.business_id.replace(/^ap_/, ''));

    const approvedMap = new Map<string, { name: string; address: string; lat: number | null; lng: number | null }>();
    if (apIds.length > 0) {
      const { data: approved } = await supabase
        .from('pending_places')
        .select('id, proposed_name, proposed_address, lat, lng')
        .in('id', apIds);
      (approved || []).forEach((p: any) =>
        approvedMap.set(`ap_${p.id}`, {
          name: p.proposed_name,
          address: p.proposed_address || '',
          lat: p.lat,
          lng: p.lng,
        })
      );
    }

    const scraped = entries.find((e: any) => e.source && e.source !== 'manual' && e.fetched_at) as any;
    lastSundaySource = scraped
      ? { source: scraped.source, url: scraped.source_url ?? null, checkedAt: scraped.fetched_at }
      : null;

    const pins: RadarPin[] = [];
    for (const entry of entries) {
      let info: { name: string; address: string; lat: number | null; lng: number | null } | null = null;
      if (entry.business_id.startsWith('ap_')) {
        info = approvedMap.get(entry.business_id) || null;
      } else {
        const biz = businesses.find(b => b.id === entry.business_id);
        if (biz) info = { name: biz.name, address: biz.address || '', lat: biz.lat ?? null, lng: biz.lng ?? null };
      }
      if (!info) continue;

      const openT = entry.open_time || '08:00';
      const closeT = entry.close_time || '21:00';
      const live = ctx.isLiveSunday && isOpenNowHR(openT, closeT);
      const status = !ctx.isLiveSunday
        ? 'unknown'
        : live
          ? (minutesLeft(closeT) <= 60 ? 'closing-soon' : 'open')
          : 'closed';

      pins.push({
        id: `sunday:${entry.business_id}`,
        layerId: 'sunday',
        sourceId: entry.business_id,
        name: info.name,
        address: info.address,
        lat: info.lat,
        lng: info.lng,
        status,
        subtitle: `${openT.slice(0, 5)}–${closeT.slice(0, 5)}`,
        draggableId: entry.business_id.startsWith('ap_') ? entry.business_id.replace(/^ap_/, '') : null,
      });
    }

    return pins.sort((a, b) => (a.subtitle || '').localeCompare(b.subtitle || ''));
  },
};
