import { RadarLayer } from './types';
import { sundayLayer } from './layers/sunday';
import { openNowLayer } from './layers/openNow';
import { pharmacyLayer } from './layers/pharmacy';
import { gasLayer, parkingLayer } from './layers/gas';
import { evLayer } from './layers/ev';

/** Order defines the order of the chips on top of the map. */
export const RADAR_LAYERS: RadarLayer[] = [
  openNowLayer,
  sundayLayer,
  pharmacyLayer,
  gasLayer,
  evLayer,
  parkingLayer,
];

export const LAYER_STORAGE_KEY = 'zadariq_radar_layers';

export function getLayer(id: string): RadarLayer | undefined {
  return RADAR_LAYERS.find(l => l.id === id);
}

export function defaultLayerIds(): string[] {
  return RADAR_LAYERS.filter(l => l.defaultOn).map(l => l.id);
}

export function loadStoredLayers(): string[] {
  try {
    const raw = localStorage.getItem(LAYER_STORAGE_KEY);
    if (!raw) return defaultLayerIds();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return defaultLayerIds();
    const valid = parsed.filter((id: string) => RADAR_LAYERS.some(l => l.id === id));
    return valid.length ? valid : defaultLayerIds();
  } catch {
    return defaultLayerIds();
  }
}

export function storeLayers(ids: string[]) {
  try {
    localStorage.setItem(LAYER_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

export * from './types';
