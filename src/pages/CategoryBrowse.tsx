import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { businesses, isBusinessOpen, categories } from '@/data/mockData';
import { BusinessCard } from '@/components/BusinessCard';
import { ReportModal } from '@/components/ReportModal';
import { Business, CategoryId } from '@/data/types';
import { ArrowLeft, Filter, Plus, MapPin, AlertTriangle } from 'lucide-react';
import { Footer } from '@/components/Footer';
import { useApprovedPlaces } from '@/hooks/useApprovedPlaces';
import { useHealthPlaces, healthPlaceToBusiness } from '@/hooks/useHealthPlaces';

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Categories that should sort by proximity when location is available
const proximitySortCategories: string[] = ['gas', 'nauticalGas', 'chargers', 'shops'];
// Extract the meaningful sort key from a business name
function getSortKey(name: string): string {
  let n = name;
  // Remove common prefixes
  const prefixes = [
    'Ordinacija dentalne medicine ', 'Ord. dentalne medicine ',
    'Stomatološka ordinacija ', 'Stom. ordinacija ',
    'Stomatološka poliklinika ', 'Dentalna poliklinika ',
    'Dental Practice ', 'Dental Center ', 'Ordinacija dr. ',
    'Ordinacija ', 'Dr. sc. ', 'Dr. ',
  ];
  for (const p of prefixes) {
    if (n.startsWith(p)) { n = n.slice(p.length); break; }
  }
  // Remove trailing titles after comma: ", dr. med. dent." etc.
  n = n.replace(/,\s*dr\..*$/i, '').trim();
  // If it looks like "FirstName LastName" (2+ words, no "Dental/Centar/Clinic" etc.), use last word (surname)
  const words = n.split(/\s+/);
  const brandWords = ['dental', 'dent', 'centar', 'center', 'clinic', 'medical', 'd.o.o.', 'poliklinika'];
  const isPersonName = words.length >= 2 && !brandWords.some(bw => n.toLowerCase().includes(bw));
  if (isPersonName) {
    // Last word is surname
    return words[words.length - 1].toLowerCase();
  }
  // For brand names, strip generic suffixes like "Dental", "Centar", "Clinic" from the front
  const significantWords = words.filter(w => !brandWords.includes(w.toLowerCase()) && w !== '—' && w !== '-');
  return (significantWords[0] || words[0]).toLowerCase();
}

export default function CategoryBrowse() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const useProximity = proximitySortCategories.includes(categoryId || '');
  const [openOnly, setOpenOnly] = useState(searchParams.get('open') === '1' || useProximity);
  const [reportTarget, setReportTarget] = useState<Business | null>(null);
  const { data: approvedPlaces } = useApprovedPlaces();
  const { data: healthPlaces } = useHealthPlaces();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  // Health umbrella sub-filter: 'all' | 'general' | 'dental' | 'specialist' | 'hospital'
  const [healthSub, setHealthSub] = useState<'all' | 'general' | 'dental' | 'specialist' | 'hospital'>('all');
  const isHealth = categoryId === 'doctor';

  // Request geolocation for proximity-sorted categories
  useEffect(() => {
    if (!useProximity) return;
    navigator.geolocation?.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {} // silently fail
    );
  }, [useProximity]);

  const category = categories.find(c => c.id === categoryId);

  const results = useMemo(() => {
    const dbHealth = (healthPlaces || []).map(healthPlaceToBusiness);
    const allBusinesses = [...businesses, ...(approvedPlaces || []), ...dbHealth];
    let r = allBusinesses.filter(b => {
      if (categoryId === 'doctor') {
        const isMedical = b.category === 'doctor' || b.category === 'dentist' || b.category === 'medicine';
        if (!isMedical) return false;
        if (healthSub === 'all') return true;
        if (healthSub === 'dental') return b.category === 'dentist';
        if (healthSub === 'hospital') {
          const n = b.name.toLowerCase();
          return n.includes('bolnica') || n.includes('opća bolnica') || n.includes('hitna') || n.includes('odjel') || (b as any).hospitalDept === true;
        }
        if (healthSub === 'specialist') {
          if (b.category !== 'medicine') return false;
          const n = b.name.toLowerCase();
          // Specialists: anything that is NOT a general/family doctor
          const generalMarkers = ['dr. med.', 'opće prakse', 'obiteljska', 'opća medicina'];
          const specialistMarkers = ['pedijatar', 'pedijatrij', 'ginekolog', 'internist', 'okulist', 'oftalmolog', 'dermatolog', 'kardiolog', 'neurolog', 'orl', 'otorinolar', 'urolog', 'ortoped', 'psihijatar', 'endokrinolog', 'reumatolog', 'gastroenterolog', 'pulmolog', 'alergolog', 'radiolog', 'poliklinika', 'specijalist', 'kirurg'];
          const hasSpecialist = specialistMarkers.some(m => n.includes(m));
          if (hasSpecialist) return true;
          // If it's flagged manually
          if ((b as any).medicalKind === 'specialist') return true;
          return false;
        }
        if (healthSub === 'general') {
          if (b.category !== 'medicine') return false;
          const n = b.name.toLowerCase();
          const specialistMarkers = ['pedijatar', 'pedijatrij', 'ginekolog', 'internist', 'okulist', 'oftalmolog', 'dermatolog', 'kardiolog', 'neurolog', 'orl', 'otorinolar', 'urolog', 'ortoped', 'psihijatar', 'endokrinolog', 'reumatolog', 'gastroenterolog', 'pulmolog', 'alergolog', 'radiolog', 'poliklinika', 'kirurg'];
          const hospitalMarkers = ['bolnica', 'odjel', 'hitna'];
          if (specialistMarkers.some(m => n.includes(m))) return false;
          if (hospitalMarkers.some(m => n.includes(m))) return false;
          if ((b as any).medicalKind === 'specialist' || (b as any).hospitalDept) return false;
          return true;
        }
        return true;
      }
      return b.category === categoryId;
    });
    if (openOnly) r = r.filter(isBusinessOpen);
    
    // Sort by proximity if location available and category supports it
    if (useProximity && userLocation) {
      r.sort((a, b) => {
        const distA = (a.lat && a.lng) ? distanceKm(userLocation.lat, userLocation.lng, a.lat, a.lng) : 9999;
        const distB = (b.lat && b.lng) ? distanceKm(userLocation.lat, userLocation.lng, b.lat, b.lng) : 9999;
        return distA - distB;
      });
    } else {
      // Default alphabetical sort
      r.sort((a, b) => getSortKey(a.name).localeCompare(getSortKey(b.name), 'hr'));
    }
    return r;
  }, [categoryId, openOnly, approvedPlaces, healthPlaces, userLocation, useProximity, healthSub]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="text-base font-semibold text-foreground">
            {category ? t(category.labelKey) : categoryId}
          </h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pb-8">
        {isHealth && (
          <>
            {/* Sub-filter chips for Health umbrella */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar mt-4 -mx-1 px-1">
              {([
                { key: 'all', label: t('health.subAll') },
                { key: 'general', label: t('health.subGeneral') },
                { key: 'dental', label: t('health.subDental') },
                { key: 'specialist', label: t('health.subSpecialist') },
                { key: 'hospital', label: t('health.subHospital') },
              ] as const).map((tab) => {
                const active = healthSub === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setHealthSub(tab.key)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
            {/* Data-in-preparation warning */}
            {(healthSub === 'specialist' || healthSub === 'hospital') && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 mt-3">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-900 dark:text-amber-200 leading-snug">
                  {t('health.inPreparation')}
                </p>
              </div>
            )}
          </>
        )}
        {useProximity && !userLocation && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/10 mt-4 mb-2">
            <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
            <p className="text-xs text-muted-foreground">Uključi lokaciju za sortiranje po udaljenosti</p>
          </div>
        )}
        <div className="flex items-center justify-between mt-4 mb-4">
          <span className="text-sm text-muted-foreground">{results.length} results</span>
          <div className="flex items-center gap-2">
            {categoryId === 'cafes' && (
              <button
                onClick={() => navigate('/add-cafe')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-3 w-3" />
                {t('addCafe.addButton')}
              </button>
            )}
            <button
              onClick={() => setOpenOnly(!openOnly)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                openOnly ? 'bg-status-open text-status-open-foreground' : 'bg-secondary text-secondary-foreground'
              }`}
            >
              <Filter className="h-3 w-3" />
              {t('action.filter.openNow')}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {results.map((b) => (
            <BusinessCard key={b.id} business={b} onReport={setReportTarget} />
          ))}
          {results.length === 0 && (
            <p className="text-center text-muted-foreground py-12 text-sm">No businesses found</p>
          )}
        </div>
      </main>
      <Footer />
      <ReportModal business={reportTarget} open={!!reportTarget} onClose={() => setReportTarget(null)} />
    </div>
  );
}
