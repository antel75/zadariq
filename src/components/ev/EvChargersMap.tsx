import { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { EvCharger, getChargerStatusLabel } from '@/hooks/useEvChargers';
import { Navigation, Zap } from 'lucide-react';

// Fix default marker icon issue in bundled Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const STATUS_COLORS: Record<string, string> = {
  available: '#22c55e',
  busy: '#f59e0b',
  broken: '#ef4444',
  unknown: '#6366f1',
};

function createIcon(status: string) {
  const color = STATUS_COLORS[status] || STATUS_COLORS.unknown;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
    <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.27 21.73 0 14 0z" fill="${color}" stroke="#fff" stroke-width="1.5"/>
    <circle cx="14" cy="13" r="6" fill="#fff" opacity="0.9"/>
    <text x="14" y="16.5" text-anchor="middle" font-size="11" font-weight="bold" fill="${color}">⚡</text>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -36],
  });
}

interface EvChargersMapProps {
  chargers: EvCharger[];
}

export function EvChargersMap({ chargers }: EvChargersMapProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const center = useMemo(() => {
    if (!chargers.length) return [44.115, 15.23] as [number, number];
    const avgLat = chargers.reduce((s, c) => s + c.lat, 0) / chargers.length;
    const avgLng = chargers.reduce((s, c) => s + c.lng, 0) / chargers.length;
    return [avgLat, avgLng] as [number, number];
  }, [chargers]);

  if (!chargers.length) return null;

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 rounded-xl bg-card border border-border/50 mb-2 text-sm font-medium text-foreground"
      >
        <span className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          Mapa punjača
        </span>
        <span className="text-xs text-muted-foreground">
          {isExpanded ? 'Sakrij' : 'Prikaži'}
        </span>
      </button>
      {isExpanded && (
        <div className="rounded-xl overflow-hidden border border-border/50" style={{ height: 280 }}>
          <MapContainer
            center={center}
            zoom={11}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
            attributionControl={false}
          >
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
            {chargers.map((charger) => (
              <Marker
                key={charger.id}
                position={[charger.lat, charger.lng]}
                icon={createIcon(charger.status)}
              >
                <Popup>
                  <div className="text-xs min-w-[160px]" style={{ color: '#1a1a2e' }}>
                    <p className="font-bold text-sm mb-0.5">{charger.name}</p>
                    {charger.operator && (
                      <p className="text-gray-500">{charger.operator}</p>
                    )}
                    <p className="mt-1 font-semibold" style={{ color: STATUS_COLORS[charger.status] || '#6366f1' }}>
                      {getChargerStatusLabel(charger.status)}
                    </p>
                    {charger.power_kw && (
                      <p className="text-gray-600">{charger.power_kw} kW</p>
                    )}
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${charger.lat},${charger.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-1.5 px-2 py-1 rounded bg-indigo-500 text-white text-[11px] font-medium no-underline"
                    >
                      <span>↗</span> Navigacija
                    </a>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}
    </div>
  );
}
