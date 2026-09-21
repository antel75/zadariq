import { useRef } from 'react';
import { Navigation, Phone } from 'lucide-react';
import { RadarPin, STATUS_COLORS, statusLabel } from '@/lib/radar/types';
import { getLayer } from '@/lib/radar';

export type SheetSnap = 'peek' | 'half' | 'full';

const SNAP_HEIGHT: Record<SheetSnap, string> = {
  peek: '84px',
  half: '45vh',
  full: '85vh',
};

interface Props {
  pins: RadarPin[];
  snap: SheetSnap;
  selectedId: string | null;
  isEn: boolean;
  loading: boolean;
  onSnapChange: (snap: SheetSnap) => void;
  onSelect: (pin: RadarPin) => void;
}

function formatDistance(m?: number): string | null {
  if (m == null) return null;
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`;
}

export function RadarSheet({ pins, snap, selectedId, isEn, loading, onSnapChange, onSelect }: Props) {
  const startY = useRef<number | null>(null);

  const cycle = () => {
    onSnapChange(snap === 'peek' ? 'half' : snap === 'half' ? 'full' : 'peek');
  };

  const onPointerDown = (e: React.PointerEvent) => { startY.current = e.clientY; };
  const onPointerUp = (e: React.PointerEvent) => {
    if (startY.current == null) return;
    const dy = e.clientY - startY.current;
    startY.current = null;
    if (Math.abs(dy) < 24) { cycle(); return; }
    const order: SheetSnap[] = ['peek', 'half', 'full'];
    const i = order.indexOf(snap);
    const next = dy < 0 ? Math.min(i + 1, 2) : Math.max(i - 1, 0);
    onSnapChange(order[next]);
  };

  return (
    <div
      className="absolute left-0 right-0 bottom-0 z-[1000] bg-background/95 backdrop-blur-xl border-t border-border rounded-t-3xl shadow-2xl transition-[height] duration-300 ease-out flex flex-col"
      style={{ height: SNAP_HEIGHT[snap] }}
    >
      <div
        className="shrink-0 pt-2 pb-1 cursor-grab select-none touch-none"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        <div className="mx-auto w-10 h-1.5 rounded-full bg-muted-foreground/30" />
        <p className="text-center text-xs font-semibold text-foreground mt-2">
          {loading
            ? (isEn ? 'Loading…' : 'Učitavanje…')
            : `${pins.length} ${isEn ? 'places' : 'mjesta'} ${isEn ? 'nearby' : 'u blizini'}`}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-24 space-y-2">
        {!loading && pins.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">
            {isEn ? 'No places for the selected layers.' : 'Nema mjesta za odabrane slojeve.'}
          </p>
        )}
        {pins.map(pin => {
          const layer = getLayer(pin.layerId);
          const dist = formatDistance(pin.distance);
          const selected = selectedId === pin.id;
          return (
            <div
              key={pin.id}
              onClick={() => onSelect(pin)}
              className={`flex items-center gap-3 p-3 rounded-xl border bg-card cursor-pointer transition-all ${
                selected ? 'border-accent ring-2 ring-accent/40 shadow-lg' : 'border-border hover:border-accent/40'
              }`}
            >
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0"
                style={{ background: `${STATUS_COLORS[pin.status]}22` }}
              >
                {layer?.icon}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{pin.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {[pin.subtitle, dist].filter(Boolean).join(' · ')}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: `${STATUS_COLORS[pin.status]}1f`, color: STATUS_COLORS[pin.status] }}
                >
                  {statusLabel(pin.status, isEn)}
                </span>
                {pin.phone && (
                  <a
                    href={`tel:${pin.phone}`}
                    onClick={e => e.stopPropagation()}
                    className="p-1.5 rounded-lg bg-secondary text-foreground"
                  >
                    <Phone className="h-3.5 w-3.5" />
                  </a>
                )}
                {pin.lat != null && pin.lng != null && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${pin.lat},${pin.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="p-1.5 rounded-lg bg-primary text-primary-foreground"
                  >
                    <Navigation className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
