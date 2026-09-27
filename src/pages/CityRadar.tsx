import { useCallback, useEffect, useMemo, useRef, useState, lazy, Suspense } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Crosshair, List, Map, Search } from 'lucide-react';
import type { Map as LeafletMap } from 'leaflet';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSelector } from '@/components/LanguageSelector';
import { PageSEO } from '@/components/PageSEO';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { RadarList } from '@/components/radar/RadarList';
import { addDays, upcomingSunday, validSunday, zagrebDate } from '@/lib/radar/calendar';
const RadarMap = lazy(() => import('@/components/radar/RadarMap').then(m => ({ default: m.RadarMap })));
import { RadarSheet, SheetSnap } from '@/components/radar/RadarSheet';
import { LayerChips } from '@/components/radar/LayerChips';
import { getLayer, loadStoredLayers, storeLayers } from '@/lib/radar';
import { RadarPin } from '@/lib/radar/types';
import { lastSundaySource } from '@/lib/radar/layers/sunday';

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

  const [now, setNow] = useState(() => new Date());
  const [chosenSunday, setChosenSunday] = useState<string | null>(null);
  const sundayDate = validSunday(previewParam) ? previewParam : chosenSunday || upcomingSunday(now);
  const dayState = { sundayDate, isLiveSunday: !previewParam && sundayDate === zagrebDate(now) };
  const [view, setView] = useState<'list' | 'map'>(previewParam ? 'map' : 'list');
  const [query, setQuery] = useState('');
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [failedLayers, setFailedLayers] = useState<string[]>([]);
  const [locating, setLocating] = useState(false);
  const [refresh, setRefresh] = useState(0);

  const [activeLayers, setActiveLayers] = useState<string[]>(() => {
    const stored = loadStoredLayers();
    if (layerParam && getLayer(layerParam)) {
      return [layerParam];
    }
    return stored;
  });
  const [pinsByLayer, setPinsByLayer] = useState<Record<string, RadarPin[]>>({});
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [snap, setSnap] = useState<SheetSnap>('peek');
  const [sourceLine, setSourceLine] = useState<string | null>(null);
  const mapInstance = useRef<LeafletMap | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      toast.error(isEn ? 'Location is unavailable in this browser.' : 'Lokacija nije dostupna u ovom pregledniku.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => { setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocating(false); },
      () => { setLocating(false); toast.error(isEn ? 'Location unavailable. You can still search by address.' : 'Lokacija nije dostupna. I dalje možeš pretraživati po adresi.'); },
      { maximumAge: 60000, timeout: 8000 }
    );
  };

  // Load active layers
  useEffect(() => {
    let cancelled = false;
    const ctx = { sundayDate: dayState.sundayDate, isLiveSunday: dayState.isLiveSunday };
    setLoading(true);
    setSourceLine(null);
    const failed: string[] = [];
    Promise.all(
      activeLayers.map(async id => {
        const layer = getLayer(id);
        if (!layer) return [id, [] as RadarPin[]] as const;
        try {
          return [id, await layer.load(ctx)] as const;
        } catch {
          failed.push(id);
          return [id, [] as RadarPin[]] as const;
        }
      })
    ).then(results => {
      if (cancelled) return;
      const next: Record<string, RadarPin[]> = {};
      results.forEach(([id, pins]) => { next[id] = pins; });
      setPinsByLayer(next);
      setFailedLayers(failed);
      setLoading(false);
      if (activeLayers.includes('sunday') && lastSundaySource) {
        const when = new Date(lastSundaySource.checkedAt).toLocaleString(isEn ? 'en-GB' : 'hr-HR', {
          timeZone: 'Europe/Zagreb', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
        });
        setSourceLine(`${isEn ? 'Source' : 'Izvor'}: ${lastSundaySource.source} · ${isEn ? 'imported' : 'preuzeto'} ${when}`);
      } else {
        setSourceLine(null);
      }
    });
    return () => { cancelled = true; };
  }, [activeLayers, dayState.sundayDate, dayState.isLiveSunday, isEn, now, refresh]);

  const pins = useMemo(() => {
    const bySource = new globalThis.Map<string, RadarPin>();
    activeLayers.flatMap(id => pinsByLayer[id] || []).forEach(pin => {
      const previous = bySource.get(pin.sourceId);
      if (!previous || (pin.layerId === 'sunday' && dayState.isLiveSunday) || pin.status === 'duty') bySource.set(pin.sourceId, pin);
    });
    const term = query.toLocaleLowerCase().trim();
    const all = [...bySource.values()].filter(pin =>
      (!term || `${pin.name} ${pin.address}`.toLocaleLowerCase().includes(term)) &&
      (!onlyOpen || ['open', 'closing-soon', 'duty'].includes(pin.status))
    );
    const withDistance = all.map(p =>
      userLocation && p.lat != null && p.lng != null
        ? { ...p, distance: getDistance(userLocation.lat, userLocation.lng, p.lat, p.lng) }
        : p
    );
    return withDistance.sort((a, b) => {
      const rank = (p: RadarPin) => ['open', 'closing-soon', 'duty'].includes(p.status) ? 0 : p.status === 'unknown' ? 1 : 2;
      if (rank(a) !== rank(b)) return rank(a) - rank(b);
      if (a.distance != null && b.distance != null) return a.distance - b.distance;
      if (a.distance != null) return -1;
      if (b.distance != null) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [activeLayers, pinsByLayer, userLocation, query, onlyOpen, dayState.isLiveSunday]);

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
    <div className={view === 'map' ? 'h-[100dvh] w-full bg-background flex flex-col overflow-hidden' : 'min-h-screen bg-background text-foreground'}>
      <PageSEO
        title="Radar Zadar — što je sada otvoreno | ZadarIQ"
        description="Pronađi otvorena mjesta u Zadru. Radne nedjelje, ljekarne, gorivo i parking u preglednom popisu ili na karti."
        path="/radar"
      />

      <header className="shrink-0 z-[1100] bg-background/90 backdrop-blur-lg border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <button aria-label={isEn ? "Home" : "Početna"} onClick={() => navigate('/')} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </button>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-foreground truncate">📍 Radar Zadar</h1>
              <p className="text-[11px] text-muted-foreground truncate">
                {loading
                  ? (isEn ? 'Loading…' : 'Učitavanje…')
                  : `${isEn ? 'Open now' : 'Otvoreno sada'}: ${openCount} · ${isEn ? 'Results' : 'Rezultati'}: ${pins.length}`}
              </p>
            </div>
          </div>
          <LanguageSelector />
        </div>
        <div className="max-w-4xl mx-auto px-4 pt-5 pb-3">
          {view === 'list' && <><p className="text-xs uppercase tracking-widest text-muted-foreground">{isEn ? 'Your city, at a glance' : 'Tvoj grad, na jednom mjestu'}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">{isEn ? 'Where do you want to go?' : 'Kamo želiš otići?'}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{isEn ? 'Find a place, check its hours and get directions.' : 'Pronađi mjesto, provjeri radno vrijeme i kreni.'}</p></>}
          <div className="mt-4 flex gap-3">
            <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3 focus-within:ring-2 focus-within:ring-primary">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input aria-label={isEn ? 'Search name or address' : 'Pretraži naziv ili adresu'} value={query} onChange={e => setQuery(e.target.value)} placeholder={isEn ? 'Name, street, neighbourhood…' : 'Naziv, ulica, kvart…'} className="w-full bg-transparent py-3 text-sm outline-none" />
            </label>
            <div className="flex rounded-xl border border-border p-1" role="group" aria-label={isEn ? 'Display' : 'Prikaz'}>
              <button onClick={() => setView('list')} aria-pressed={view === 'list'} className={`flex items-center gap-1.5 rounded-lg px-3 text-sm ${view === 'list' ? 'bg-primary text-primary-foreground' : ''}`}><List className="h-4 w-4" /><span className="hidden sm:inline">{isEn ? 'List' : 'Popis'}</span><span className="sr-only sm:hidden">{isEn ? 'List' : 'Popis'}</span></button>
              <button onClick={() => setView('map')} aria-pressed={view === 'map'} className={`flex items-center gap-1.5 rounded-lg px-3 text-sm ${view === 'map' ? 'bg-primary text-primary-foreground' : ''}`}><Map className="h-4 w-4" /><span className="hidden sm:inline">{isEn ? 'Map' : 'Karta'}</span><span className="sr-only sm:hidden">{isEn ? 'Map' : 'Karta'}</span></button>
            </div>
          </div>
        </div>
        <div className="max-w-4xl mx-auto">
          <LayerChips active={activeLayers} counts={counts} isEn={isEn} onToggle={toggleLayer} />
        </div>
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-3 px-4 pb-4 pt-2">
          <button onClick={requestLocation} disabled={locating} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs"><Crosshair className="h-4 w-4" />{locating ? (isEn ? 'Locating…' : 'Tražim lokaciju…') : userLocation ? (isEn ? 'Update location' : 'Osvježi lokaciju') : (isEn ? 'Near me' : 'U mojoj blizini')}</button>
          <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={onlyOpen} onChange={e => setOnlyOpen(e.target.checked)} />{isEn ? 'Open now only' : 'Samo otvoreno sada'}</label>
          {activeLayers.includes('sunday') && <label className="flex items-center gap-2 text-xs sm:ml-auto">{isEn ? 'Sunday' : 'Nedjelja'}<select aria-label={isEn ? 'Sunday date' : 'Datum nedjelje'} value={sundayDate} disabled={!!previewParam} onChange={e => { setChosenSunday(e.target.value); setOnlyOpen(false); }} className="rounded-lg border border-border bg-background px-2 py-2">
            {[...new Set([sundayDate, ...Array.from({ length: 4 }, (_, i) => addDays(upcomingSunday(now), i * 7))])].sort().map(date => <option key={date} value={date}>{new Date(`${date}T12:00:00Z`).toLocaleDateString(isEn ? 'en-GB' : 'hr-HR', { timeZone: 'Europe/Zagreb', day: 'numeric', month: 'long', year: 'numeric' })}</option>)}
          </select></label>}
        </div>
        {failedLayers.length > 0 && <div role="alert" className="mx-auto max-w-4xl px-4 pb-3 text-sm text-destructive">{isEn ? 'Some categories could not load: ' : 'Nije moguće učitati dio kategorija: '}{failedLayers.map(id => isEn ? getLayer(id)?.label.en : getLayer(id)?.label.hr).join(', ')}. <button className="underline" onClick={() => setRefresh(n => n + 1)}>{isEn ? 'Try again' : 'Pokušaj ponovno'}</button></div>}
        {(sourceLine || previewParam) && (
          <div className="max-w-4xl mx-auto px-4 pb-2 space-y-1">
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

      {view === 'list' ? <main className="mx-auto max-w-4xl px-4 py-6 pb-24">
        <p className="mb-4 text-xs text-muted-foreground">{isEn ? 'Hours follow published schedules. Check with the venue before travelling.' : 'Radno vrijeme prikazujemo prema rasporedima. Prije polaska provjeri kod objekta.'}</p>
        <RadarList pins={pins} isEn={isEn} loading={loading} planned={!dayState.isLiveSunday} />
      </main> : <div className="relative flex-1 min-h-0">
        <Suspense fallback={<p role="status" className="p-8 text-center">{isEn ? 'Loading map…' : 'Učitavam kartu…'}</p>}><RadarMap
          pins={pins}
          userLocation={userLocation}
          selectedId={selectedId}
          isEn={isEn}
          editMode={editMode}
          onSelect={handleSelect}
          onPinMoved={handlePinMoved}
          onMapReady={map => { mapInstance.current = map; }}
        /></Suspense>

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
      </div>}
    </div>
  );
}
