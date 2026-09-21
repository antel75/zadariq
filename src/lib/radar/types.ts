export type PinStatus = 'open' | 'closing-soon' | 'closed' | 'duty' | 'unknown';

export interface RadarPin {
  /** Unique across all layers: `${layerId}:${sourceId}` */
  id: string;
  layerId: string;
  /** Underlying business / place id (used for navigation + admin pin drag) */
  sourceId: string;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  status: PinStatus;
  /** Short line under the name in the list (hours, power, price…) */
  subtitle?: string;
  phone?: string | null;
  /** Route inside the app to open more detail */
  detailPath?: string;
  /** Distance in meters, filled by the page once location is known */
  distance?: number;
  /** Admin pin-drag is only allowed for community places (`pending_places`) */
  draggableId?: string | null;
}

export interface RadarLayerContext {
  /** YYYY-MM-DD of the Sunday currently in focus */
  sundayDate: string;
  isLiveSunday: boolean;
}

export interface RadarLayer {
  id: string;
  label: { hr: string; en: string };
  icon: string;
  /** Tailwind-free hex used for the map pin ring/dot of this layer */
  color: string;
  defaultOn: boolean;
  load: (ctx: RadarLayerContext) => Promise<RadarPin[]>;
}

export const STATUS_COLORS: Record<PinStatus, string> = {
  open: '#22c55e',
  'closing-soon': '#f59e0b',
  closed: '#6b7280',
  duty: '#0ea5e9',
  unknown: '#94a3b8',
};

export function statusLabel(status: PinStatus, isEn: boolean): string {
  switch (status) {
    case 'open':
      return isEn ? 'Open' : 'Otvoreno';
    case 'closing-soon':
      return isEn ? 'Closing soon' : 'Uskoro zatvara';
    case 'closed':
      return isEn ? 'Closed' : 'Zatvoreno';
    case 'duty':
      return isEn ? 'On duty' : 'Dežurno';
    default:
      return isEn ? 'Unknown' : 'Nepoznato';
  }
}
