import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Crosshair } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSelector } from '@/components/LanguageSelector';
import { PageSEO } from '@/components/PageSEO';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { RadarMap } from '@/components/radar/RadarMap';
import { RadarSheet, SheetSnap } from '@/components/radar/RadarSheet';
import { LayerChips } from '@/components/radar/LayerChips';
import { RADAR_LAYERS, getLayer, loadStoredLayers, storeLayers } from '@/lib/radar';
import { RadarPin } from '@/lib/radar/types';
import { lastSundaySource } from '@/lib/radar/layers/sunday';

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
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Zagreb' }));
  const isSunday = now.getDay() === 0;
  const isLiveSunday = isSunday && now.getHours() < 22;
  return {
    isLiveSunday,
    sundayDate: isLiveSunday ? formatDateString(now) : getNextSundayDate(),
  };
}

function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export default function CityRadar() {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAdmin } = useAuth();

  const previewParam = searchParams.get('preview');
  const layerParam = searchParams.get('layer');
  const editMode = !!previewParam && isAdmin;

  const [dayState, setDayState] = useState(() => {
    const base = computeDayState();
    if (previewParam && /^\d{4}-\d{2}-\d{2}$/.test(previewParam)) {
      return { isLiveSunday: false, sundayDate: previewParam };
    }
    return base;
  });

  const [activeLayers, setActiveLayers] = useState<string[]>(() => {
    const stored = loadStoredLayers();
    if (layerParam && getLayer(layerParam)) {
      return stored.includes(layerParam) ? stored : [...stored, layerParam];
    }
    return stored;
  });
  const [pinsByLayer, setPinsByLayer] = useState<Record<string, RadarPin[]>>({});
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [snap, setSnap] = useState<SheetSnap>('peek');
  const [sourceLine, setSourceLine] = useState<string | null>(null);
  const mapInstance = useRef<any>(null);

  // Refresh day state every minute (unless previewing a fixed date)
  useEffect(() => {
    if (previewParam) return;
    const t = setInterval(() => setDayState(computeDayState()), 60000);
    return () => clearInterval(t);
  }, [previewParam]);

  // Geolocation
  useEffect(() => {
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 8000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  // Load active layers
  useEffect(() => {
    let cancelled = false;
    const ctx = { sundayDate: dayState.sundayDate, isLiveSunday: dayState.isLiveSunday };
    setLoading(true);
    Promise.all(
      activeLayers.map(async id => {
        const layer = getLayer(id);
        if (!layer) return [id, [] as RadarPin[]] as const;
        try {
          return [id, await layer.load(ctx)] as const;
        } catch {
          return [id, [] as RadarPin[]] as const;
        }
      })
    ).then(results => {
      if (cancelled) return;
      const next: Record<string, RadarPin[]> = {};
      results.forEach(([id, pins]) => { next[id] = pins; });
      setPinsByLayer(next);
      setLoading(false);
      if (activeLayers.includes('sunday') && lastSundaySource) {
        const when = new Date(lastSundaySource.checkedAt).toLocaleString(isEn ? 'en-GB' : 'hr-HR', {
          timeZone: 'Europe/Zagreb', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
        });
        setSourceLine(`${isEn ? 'Source' : 'Izvor'}: ${lastSundaySource.source} · ${isEn ? 'checked' : 'provjereno'} ${when}`);
      } else {
        setSourceLine(null);
      }
    });
    return () => { cancelled = true; };
  }, [activeLayers, dayState.sundayDate, dayState.isLiveSunday, isEn]);

  const pins = useMemo(() => {
    const all = activeLayers.flatMap(id => pinsByLayer[id] || []);
    const withDistance = all.map(p =>
      userLocation && p.lat != null && p.lng != null
        ? { ...p, distance: getDistance(userLocation.lat, userLocation.lng, p.lat, p.lng) }
        : p
    );
    return withDistance.sort((a, b) => {
      if (a.distance != null && b.distance != null) return a.distance - b.distance;
      if (a.distance != null) return -1;
      if (b.distance != null) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [activeLayers, pinsByLayer, userLocation]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    Object.entries(pinsByLayer).forEach(([id, list]) => { c[id] = list.length; });
    return c;
  }, [pinsByLayer]);

  const openCount = pins.filter(p => p.status === 'open' || p.status === 'closing-soon' || p.status === 'duty').length;

  const toggleLayer = (id: string) => {
    setActiveLayers(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      storeLayers(next);
      return next;
    });
    if (layerParam) {
      searchParams.delete('layer');
      setSearchParams(searchParams, { replace: true });
    }
  };

  const handleSelect = useCallback((pin: RadarPin) => {
    setSelectedId(pin.id);
    setSnap(prev => (prev === 'peek' ? 'half' : prev));
  }, []);

  const handlePinMoved = useCallback(async (pin: RadarPin, lat: number, lng: number) => {
    if (!pin.draggableId) {
      toast.error(`${pin.name}: nije custom mjesto (ne mogu spremiti)`);
      return;
    }
    setPinsByLayer(prev => {
      const next: Record<string, RadarPin[]> = {};
      Object.entries(prev).forEach(([id, list]) => {
        next[id] = list.map(p => (p.id === pin.id ? { ...p, lat, lng } : p));
      });
      return next;
    });
    const { error } = await supabase.from('pending_places').update({ lat, lng }).eq('id', pin.draggableId);
    if (error) toast.error(`Greška: ${error.message}`);
    else toast.success(`✓ ${pin.name}: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
  }, []);

  return (
    <div className="h-[100dvh] w-full bg-background flex flex-col overflow-hidden">
      <PageSEO
        title="Radar Zadar — što je sada otvoreno | ZadarIQ"
        description="Živa karta Zadra: otvoreno sada, radne nedjelje, dežurne ljekarne, gorivo, EV punjači i parking na jednom mjestu."
        path="/radar"
      />

      <header className="shrink-0 z-[1100] bg-background/90 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => navigate('/')} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </button>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-foreground truncate">📍 Radar Zadar</h1>
              <p className="text-[11px] text-muted-foreground truncate">
                {loading
                  ? (isEn ? 'Loading…' : 'Učitavanje…')
                  : `${openCount} ${isEn ? 'open now' : 'otvoreno sada'} · ${pins.length} ${isEn ? 'on map' : 'na karti'}`}
              </p>
            </div>
          </div>
          <LanguageSelector />
        </div>
        <div className="max-w-lg mx-auto">
          <LayerChips active={activeLayers} counts={counts} isEn={isEn} onToggle={toggleLayer} />
        </div>
        {(sourceLine || previewParam) && (
          <div className="max-w-lg mx-auto px-4 pb-2 space-y-1">
            {previewParam && (
              <p className="text-[10px] text-amber-500 text-center">
                🛠️ Preview za <strong>{previewParam}</strong>
                {editMode ? ' — povuci pin za fino podešavanje (auto-save)' : ' — prijavi se kao admin za uređivanje'}
              </p>
            )}
            {sourceLine && <p className="text-[10px] text-muted-foreground text-center">{sourceLine}</p>}
          </div>
        )}
      </header>

      <div className="relative flex-1">
        <RadarMap
          pins={pins}
          userLocation={userLocation}
          selectedId={selectedId}
          isEn={isEn}
          editMode={editMode}
          onSelect={handleSelect}
          onPinMoved={handlePinMoved}
          onMapReady={map => { mapInstance.current = map; }}
        />

        {userLocation && (
          <button
            onClick={() => mapInstance.current?.setView([userLocation.lat, userLocation.lng], 15, { animate: true })}
            className="absolute right-4 z-[1001] p-3 rounded-full bg-background border border-border shadow-lg"
            style={{ bottom: snap === 'peek' ? '104px' : 'calc(45vh + 20px)' }}
            aria-label={isEn ? 'Center on me' : 'Centriraj na mene'}
          >
            <Crosshair className="h-5 w-5 text-primary" />
          </button>
        )}

        <RadarSheet
          pins={pins}
          snap={snap}
          selectedId={selectedId}
          isEn={isEn}
          loading={loading}
          onSnapChange={setSnap}
          onSelect={handleSelect}
        />
      </div>
    </div>
  );
}
