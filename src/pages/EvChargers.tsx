import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap, MapPin } from 'lucide-react';
import { useEvChargers, distanceKm } from '@/hooks/useEvChargers';
import { EvChargerCard } from '@/components/ev/EvChargerCard';
import { EvChargersMap } from '@/components/ev/EvChargersMap';
import { supabase } from '@/integrations/supabase/client';

export default function EvChargers() {
  const navigate = useNavigate();
  const { data: chargers, isLoading } = useEvChargers();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [reportCounts, setReportCounts] = useState<Record<string, number>>({});

  // Get user location
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {} // Silently fail
    );
  }, []);

  // Load report counts
  useEffect(() => {
    async function loadCounts() {
      if (!chargers?.length) return;
      const oneDay = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from('ev_charger_reports')
        .select('charger_id')
        .gte('created_at', oneDay);
      if (data) {
        const counts: Record<string, number> = {};
        for (const r of data as any[]) {
          counts[r.charger_id] = (counts[r.charger_id] || 0) + 1;
        }
        setReportCounts(counts);
      }
    }
    loadCounts();
  }, [chargers]);

  // Sort: available first, then by distance
  const sorted = useMemo(() => {
    if (!chargers) return [];
    return [...chargers].sort((a, b) => {
      // Status priority: available > unknown > busy > broken
      const statusOrder: Record<string, number> = { available: 0, unknown: 1, busy: 2, broken: 3 };
      const sa = statusOrder[a.status] ?? 1;
      const sb = statusOrder[b.status] ?? 1;
      if (sa !== sb) return sa - sb;

      // Then by distance if we have location
      if (userLocation) {
        const da = distanceKm(userLocation.lat, userLocation.lng, a.lat, a.lng);
        const db = distanceKm(userLocation.lat, userLocation.lng, b.lat, b.lng);
        return da - db;
      }
      return 0;
    });
  }, [chargers, userLocation]);

  return (
    <div className="min-h-screen gradient-bg">
      <header className="sticky top-0 z-30 glass border-b border-border/50">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <h1 className="text-base font-bold text-foreground">Punjenje auta</h1>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4">
        {!userLocation && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/10 mb-4">
            <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              Uključi lokaciju za sortiranje po udaljenosti
            </p>
          </div>
        )}

        {!isLoading && sorted.length > 0 && (
          <EvChargersMap chargers={sorted} />
        )}

        {isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-8">Učitavanje punjača...</p>
        ) : sorted.length === 0 ? (
          <div className="text-center py-12">
            <Zap className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Nema punjača u bazi. Pokreni import iz OSM-a u admin panelu.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">{sorted.length} punjača</p>
            {sorted.map((charger) => (
              <EvChargerCard
                key={charger.id}
                charger={charger}
                userLat={userLocation?.lat}
                userLng={userLocation?.lng}
                reportCount={reportCounts[charger.id] || 0}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
