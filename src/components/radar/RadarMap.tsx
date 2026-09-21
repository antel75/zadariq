import { useEffect, useRef, useState } from 'react';
import { RadarPin, STATUS_COLORS, statusLabel } from '@/lib/radar/types';
import { getLayer } from '@/lib/radar';

interface Props {
  pins: RadarPin[];
  userLocation: { lat: number; lng: number } | null;
  selectedId: string | null;
  isEn: boolean;
  editMode?: boolean;
  onSelect: (pin: RadarPin) => void;
  onPinMoved?: (pin: RadarPin, lat: number, lng: number) => void;
  onMapReady?: (map: any) => void;
}

const ZADAR_CENTER = { lat: 44.1194, lng: 15.2314 };

function useLeaflet() {
  const [loaded, setLoaded] = useState(!!(window as any).L?.markerClusterGroup);

  useEffect(() => {
    if (loaded) return;
    const addCss = (href: string) => {
      if (document.querySelector(`link[href="${href}"]`)) return;
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    };
    addCss('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
    addCss('https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css');
    addCss('https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css');

    const loadCluster = () => {
      if ((window as any).L?.markerClusterGroup) { setLoaded(true); return; }
      const s = document.createElement('script');
      s.src = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js';
      s.onload = () => setLoaded(true);
      document.head.appendChild(s);
    };

    if ((window as any).L) { loadCluster(); return; }
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = loadCluster;
    document.head.appendChild(script);
  }, [loaded]);

  return loaded;
}

export function RadarMap({
  pins, userLocation, selectedId, isEn, editMode, onSelect, onPinMoved, onMapReady,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const clusterRef = useRef<any>(null);
  const markerIndex = useRef<Record<string, any>>({});
  const didCenterRef = useRef(false);
  const userMarkerRef = useRef<any>(null);
  const loaded = useLeaflet();

  // Init map once
  useEffect(() => {
    if (!loaded || !containerRef.current || mapRef.current) return;
    const L = (window as any).L;
    const map = L.map(containerRef.current, { zoomControl: false }).setView(
      [ZADAR_CENTER.lat, ZADAR_CENTER.lng], 14
    );
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(map);
    L.control.zoom({ position: 'topright' }).addTo(map);
    mapRef.current = map;
    onMapReady?.(map);
  }, [loaded, onMapReady]);

  // User dot
  useEffect(() => {
    if (!mapRef.current || !userLocation) return;
    const L = (window as any).L;
    const icon = L.divIcon({
      html: `<div style="width:16px;height:16px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.35)"></div>`,
      iconSize: [16, 16], iconAnchor: [8, 8], className: '',
    });
    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
    } else {
      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon, zIndexOffset: 1000 }).addTo(mapRef.current);
    }
    if (!didCenterRef.current) {
      mapRef.current.setView([userLocation.lat, userLocation.lng], 14);
      didCenterRef.current = true;
    }
  }, [userLocation, loaded]);

  // Markers
  useEffect(() => {
    if (!mapRef.current || !loaded) return;
    const L = (window as any).L;
    const map = mapRef.current;

    if (clusterRef.current) {
      map.removeLayer(clusterRef.current);
    }
    const cluster = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 45,
      spiderfyOnMaxZoom: true,
    });
    markerIndex.current = {};

    for (const pin of pins) {
      if (pin.lat == null || pin.lng == null) continue;
      const layer = getLayer(pin.layerId);
      const color = STATUS_COLORS[pin.status];
      const ring = editMode && pin.draggableId ? '#f59e0b' : 'white';
      const icon = L.divIcon({
        html: `<div style="display:flex;align-items:center;justify-content:center;width:26px;height:26px;background:${color};border-radius:50%;border:2.5px solid ${ring};box-shadow:0 2px 8px rgba(0,0,0,0.35);font-size:12px;line-height:1">${layer?.icon ?? ''}</div>`,
        iconSize: [26, 26], iconAnchor: [13, 13], className: '',
      });
      const marker = L.marker([pin.lat, pin.lng], {
        icon,
        draggable: !!(editMode && pin.draggableId),
      });
      marker.on('click', () => onSelect(pin));
      if (editMode && pin.draggableId && onPinMoved) {
        marker.on('dragend', (e: any) => {
          const { lat, lng } = e.target.getLatLng();
          onPinMoved(pin, lat, lng);
        });
      }
      marker.bindTooltip(
        `<strong>${pin.name.replace(/</g, '&lt;')}</strong><br/>${statusLabel(pin.status, isEn)}`,
        { direction: 'top', offset: [0, -14] }
      );
      cluster.addLayer(marker);
      markerIndex.current[pin.id] = marker;
    }

    cluster.addTo(map);
    clusterRef.current = cluster;
  }, [pins, loaded, editMode, isEn, onSelect, onPinMoved]);

  // Focus selected pin
  useEffect(() => {
    if (!selectedId || !mapRef.current) return;
    const marker = markerIndex.current[selectedId];
    if (!marker) return;
    const ll = marker.getLatLng();
    mapRef.current.setView([ll.lat, ll.lng], Math.max(mapRef.current.getZoom(), 16), { animate: true });
    clusterRef.current?.zoomToShowLayer?.(marker, () => marker.openTooltip?.());
  }, [selectedId]);

  return (
    <div className="absolute inset-0">
      <div ref={containerRef} className="w-full h-full" />
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-secondary/50">
          <p className="text-sm text-muted-foreground">{isEn ? 'Loading map…' : 'Učitavanje karte…'}</p>
        </div>
      )}
    </div>
  );
}

export function recenter(map: any, loc: { lat: number; lng: number }) {
  map?.setView([loc.lat, loc.lng], 15, { animate: true });
}
