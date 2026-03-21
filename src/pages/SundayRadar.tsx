import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSelector } from '@/components/LanguageSelector';
import { ArrowLeft, Navigation, Store, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { businesses } from '@/data/mockData';

interface SundayEntry {
  id: string;
  business_id: string;
  sunday_date: string;
  open_time: string | null;
  close_time: string | null;
  notes: string | null;
}

interface ShopOnMap {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  open_time: string;
  close_time: string;
  isOpenNow: boolean;
  distance?: number;
}

function isOpenNow(openTime: string, closeTime: string): boolean {
  const now = new Date();
  const [oh, om] = openTime.split(':').map(Number);
  const [ch, cm] = closeTime.split(':').map(Number);
  const cur = now.getHours() * 60 + now.getMinutes();
  return cur >= oh * 60 + om && cur < ch * 60 + cm;
}

function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

function formatDateString(d: Date): string {
  return d.toISOString().split('T')[0];
}

function getNextSundayDate(): string {
  const d = new Date();
  const day = d.getDay();
  const daysUntil = (7 - day) % 7 || 7;
  d.setDate(d.getDate() + daysUntil);
  return formatDateString(d);
}

function computeDayState() {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();

  const isSunday = day === 0;
  const isLiveSunday = isSunday && hour >= 7 && hour < 22;
  const isSaturday = day === 6;

  const targetDate = isLiveSunday ? formatDateString(now) : getNextSundayDate();

  return { isSunday, isLiveSunday, isSaturday, targetDate };
}

export default function SundayRadar() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const [shops, setShops] = useState<ShopOnMap[]>([]);
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedShop, setSelectedShop] = useState<ShopOnMap | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [dayState, setDayState] = useState(computeDayState);

  // Recompute day state every minute
  useEffect(() => {
    const interval = setInterval(() => setDayState(computeDayState()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadShops(dayState.targetDate, dayState.isLiveSunday);
    loadLeaflet();
    getLocation();
  }, [dayState.targetDate]);

  const loadLeaflet = () => {
    if ((window as any).L) { setMapLoaded(true); return; }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    const link2 = document.createElement('link');
    link2.rel = 'stylesheet';
    link2.href = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css';
    document.head.appendChild(link2);
    const link3 = document.createElement('link');
    link3.rel = 'stylesheet';
    link3.href = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css';
    document.head.appendChild(link3);
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      const script2 = document.createElement('script');
      script2.src = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js';
      script2.onload = () => setMapLoaded(true);
      document.head.appendChild(script2);
    };
    document.head.appendChild(script);
  };

  const getLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.watchPosition(
      pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );
  };

  // Wake Lock - only active on live Sunday
  useEffect(() => {
    if (!dayState.isLiveSunday) return;
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        }
      } catch (e) {}
    };
    requestWakeLock();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') requestWakeLock();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (wakeLock) wakeLock.release();
    };
  }, [dayState.isLiveSunday]);

  const loadShops = async (targetDate: string, isLive: boolean) => {
    const { data } = await supabase
      .from('shop_sunday_schedule')
      .select('*')
      .eq('sunday_date', targetDate);

    const entries: SundayEntry[] = data || [];
    const result: ShopOnMap[] = [];

    for (const entry of entries) {
      const biz = businesses.find(b => b.id === entry.business_id);
      if (!biz || !(biz as any).lat) continue;
      const openT = entry.open_time || '08:00';
      const closeT = entry.close_time || '21:00';
      result.push({
        id: biz.id,
        name: biz.name,
        address: biz.address || '',
        lat: (biz as any).lat,
        lng: (biz as any).lng,
        open_time: openT,
        close_time: closeT,
        isOpenNow: isLive ? isOpenNow(openT, closeT) : false,
      });
    }
    setShops(result);
    setLoading(false);
  };

  // Init map
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || leafletMapRef.current) return;
    const L = (window as any).L;
    const center = userLocation || { lat: 44.1194, lng: 15.2314 };
    const map = L.map(mapRef.current).setView([center.lat, center.lng], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map);
    leafletMapRef.current = map;
  }, [mapLoaded]);

  // Update markers
  useEffect(() => {
    if (!leafletMapRef.current || !mapLoaded) return;
    const L = (window as any).L;
    const map = leafletMapRef.current;

    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];

    if (userLocation) {
      const userIcon = L.divIcon({
        html: `<div style="width:16px;height:16px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>`,
        iconSize: [16, 16], iconAnchor: [8, 8], className: ''
      });
      const m = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon }).addTo(map);
      markersRef.current.push(m);
    }

    const shopsWithDist = shops.map(s => ({
      ...s,
      distance: userLocation ? getDistance(userLocation.lat, userLocation.lng, s.lat, s.lng) : undefined
    }));

    for (const shop of shopsWithDist) {
      // Green only if live Sunday AND currently open, grey otherwise
      const color = (dayState.isLiveSunday && shop.isOpenNow) ? '#22c55e' : '#6b7280';
      const icon = L.divIcon({
        html: `<div style="width:18px;height:18px;background:${color};border-radius:50%;border:2.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35)"></div>`,
        iconSize: [18, 18], iconAnchor: [9, 9], className: ''
      });
      const marker = L.marker([shop.lat, shop.lng], { icon })
        .addTo(map)
        .on('click', () => setSelectedShop(shop));
      markersRef.current.push(marker);
    }

    setShops(shopsWithDist);
  }, [mapLoaded, shops.length, userLocation, dayState.isLiveSunday]);

  // Pan to user
  useEffect(() => {
    if (leafletMapRef.current && userLocation) {
      leafletMapRef.current.setView([userLocation.lat, userLocation.lng], 14);
    }
  }, [userLocation]);

  const openCount = shops.filter(s => s.isOpenNow).length;
  const shopCount = shops.length;
  const isEn = language === 'en';
  const noData = !loading && shops.length === 0;

  const getBannerContent = () => {
    if (noData) {
      return {
        emoji: '📅',
        text: isEn ? 'Data for next Sunday not available yet.' : 'Podaci za sljedeću nedjelju još nisu dostupni.',
        variant: 'muted' as const,
      };
    }
    if (dayState.isLiveSunday) {
      return {
        emoji: '🟢',
        text: isEn ? 'Sunday radar — live' : 'Nedjelja radar — uživo',
        variant: 'live' as const,
      };
    }
    if (dayState.isSaturdayPreview) {
      return {
        emoji: '🛒',
        text: isEn ? `Tomorrow ${shopCount} shops are open` : `Sutra radi ${shopCount} dućana — Preview`,
        variant: 'preview' as const,
      };
    }
    if (dayState.isSaturday) {
      return {
        emoji: '📅',
        text: isEn ? `Sunday radar available from noon` : `Sunday Radar dostupan od 12:00`,
        variant: 'muted' as const,
      };
    }
    return {
      emoji: '📅',
      text: isEn ? `Next Sunday ${shopCount} shops open` : `Sljedeće nedjelje radi ${shopCount} dućana`,
      variant: 'preview' as const,
    };
  };

  const banner = getBannerContent();

  const bannerColors = {
    live: 'bg-green-500/10 border-green-500/20 text-green-400',
    preview: 'bg-amber-500/10 border-amber-500/20 text-amber-500',
    muted: 'bg-muted/50 border-border text-muted-foreground',
  };

  const sortedShops = [...shops].sort((a, b) => {
    const tA = a.open_time || '99:99';
    const tB = b.open_time || '99:99';
    return tA.localeCompare(tB);
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border shrink-0">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-foreground">🛒 Sunday Radar</h1>
              <p className="text-[11px] text-muted-foreground">
                {dayState.isLiveSunday
                  ? (openCount > 0 ? `${openCount} ${isEn ? 'shops open now' : 'dućana otvoreno'}` : (isEn ? 'No shops open now' : 'Nema otvorenih dućana'))
                  : `${shopCount} ${isEn ? 'shops scheduled' : 'dućana planirano'}`}
              </p>
            </div>
          </div>
          <LanguageSelector />
        </div>
      </header>

      {/* Banner */}
      <div className="mx-4 mt-4 mb-2">
        <div className={`p-3 rounded-2xl border text-center text-sm font-medium ${bannerColors[banner.variant]}`}>
          {banner.emoji} {banner.text}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative" style={{minHeight: '400px'}}>
        <div ref={mapRef} style={{width: '100%', height: '400px'}} />
        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-secondary/50">
            <p className="text-sm text-muted-foreground">{isEn ? 'Loading map...' : 'Učitavanje karte...'}</p>
          </div>
        )}
        {userLocation && (
          <button
            onClick={() => leafletMapRef.current?.setView([userLocation.lat, userLocation.lng], 15)}
            className="absolute bottom-4 right-4 z-[1000] p-3 rounded-full bg-background border border-border shadow-lg"
          >
            <Navigation className="h-5 w-5 text-primary" />
          </button>
        )}
      </div>

      {/* Selected shop */}
      {selectedShop && (
        <div className="mx-4 mt-3 p-4 rounded-2xl bg-card border border-border">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-foreground text-sm">{selectedShop.name}</h3>
              <p className="text-xs text-muted-foreground">{selectedShop.address}</p>
              <div className="flex items-center gap-3 mt-2">
                {dayState.isLiveSunday && (
                  <span className={`flex items-center gap-1 text-xs font-semibold ${selectedShop.isOpenNow ? 'text-green-500' : 'text-muted-foreground'}`}>
                    <span className={`w-2 h-2 rounded-full ${selectedShop.isOpenNow ? 'bg-green-500' : 'bg-gray-400'}`} />
                    {selectedShop.isOpenNow ? (isEn ? 'Open' : 'Otvoreno') : (isEn ? 'Closed' : 'Zatvoreno')}
                  </span>
                )}
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {selectedShop.open_time?.slice(0,5)}–{selectedShop.close_time?.slice(0,5)}
                </span>
                {selectedShop.distance != null && (
                  <span className="text-xs text-muted-foreground">
                    📍 {selectedShop.distance >= 1000 ? `${(selectedShop.distance / 1000).toFixed(1)}km` : `${selectedShop.distance}m`}
                  </span>
                )}
              </div>
            </div>
            <button onClick={() => setSelectedShop(null)} className="text-muted-foreground text-lg">×</button>
          </div>
        </div>
      )}

      {/* Shop list */}
      <div className="px-4 pb-8 mt-3 space-y-2">
        <h2 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
          <Store className="h-4 w-4" />
          {isEn ? 'Shops' : 'Dućani'} ({shopCount})
        </h2>
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-4">{isEn ? 'Loading...' : 'Učitavanje...'}</p>
        ) : shops.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">{isEn ? 'No data for this Sunday.' : 'Nema podataka za ovu nedjelju.'}</p>
        ) : (
          sortedShops.map(shop => (
            <div key={shop.id}
              onClick={() => { setSelectedShop(shop); leafletMapRef.current?.setView([shop.lat, shop.lng], 16); }}
              className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card cursor-pointer hover:border-accent/40 transition-all">
              <span className={`w-3 h-3 rounded-full shrink-0 ${(dayState.isLiveSunday && shop.isOpenNow) ? 'bg-green-500' : 'bg-gray-400'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{shop.name}</p>
                <p className="text-xs text-muted-foreground">
                  {shop.open_time?.slice(0,5)} – {shop.close_time?.slice(0,5)}
                  {shop.distance != null && ` · ${shop.distance >= 1000 ? `${(shop.distance / 1000).toFixed(1)}km` : `${shop.distance}m`}`}
                </p>
              </div>
              {dayState.isLiveSunday && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${shop.isOpenNow ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-400'}`}>
                  {shop.isOpenNow ? (isEn ? 'Open' : 'Otvoreno') : (isEn ? 'Closed' : 'Zatvoreno')}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
