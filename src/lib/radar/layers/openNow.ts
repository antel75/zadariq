import { RadarLayer } from '../types';
import { loadAllPlaces, placeToPin } from '../places';

const EXCLUDED = new Set(['emergency', 'events', 'transport']);

export const openNowLayer: RadarLayer = {
  id: 'open-now',
  label: { hr: 'Otvoreno sada', en: 'Open now' },
  icon: '🟢',
  color: '#22c55e',
  defaultOn: true,
  async load() {
    const places = await loadAllPlaces();
    return places
      .filter(p => p.lat != null && p.lng != null && !EXCLUDED.has(p.category as string))
      .map(p => placeToPin(p, 'open-now'))
      .filter(pin => pin.status === 'open' || pin.status === 'closing-soon');
  },
};
