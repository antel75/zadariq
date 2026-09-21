import { RadarLayer } from '../types';
import { loadAllPlaces, placeToPin } from '../places';

export const gasLayer: RadarLayer = {
  id: 'gas',
  label: { hr: 'Gorivo', en: 'Fuel' },
  icon: '⛽',
  color: '#f59e0b',
  defaultOn: false,
  async load() {
    const places = await loadAllPlaces();
    return places
      .filter(p => p.lat != null && p.lng != null && (p.category === 'gas' || p.category === 'nauticalGas'))
      .map(p => placeToPin(p, 'gas'));
  },
};

export const parkingLayer: RadarLayer = {
  id: 'parking',
  label: { hr: 'Parking', en: 'Parking' },
  icon: '🅿️',
  color: '#6366f1',
  defaultOn: false,
  async load() {
    const places = await loadAllPlaces();
    return places
      .filter(p => p.lat != null && p.lng != null && p.category === 'parking')
      .map(p => placeToPin(p, 'parking'));
  },
};
