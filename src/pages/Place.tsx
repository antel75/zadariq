import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSelector } from '@/components/LanguageSelector';
import { ArrowLeft, Navigation, Waves, MapPin } from 'lucide-react';
import { Footer } from '@/components/Footer';

interface Beach {
  id: string;
  name: Record<string, string>;
  lat: number;
  lng: number;
  type: string[];
  tags: string[];
  free: boolean;
}

const BEACHES: Beach[] = [
  { id: 'petrcane-1', name: { hr: 'Plaža Petrčane', en: 'Petrčane Beach', de: 'Strand Petrčane', it: 'Spiaggia Petrčane' }, lat: 44.1813473, lng: 15.1612481, type: ['šljunak', 'kamen'], tags: ['mirna'], free: true },
  { id: 'petrcane-2', name: { hr: 'Javna plaža Petrčane', en: 'Public Beach Petrčane', de: 'Öffentlicher Strand Petrčane', it: 'Spiaggia pubblica Petrčane' }, lat: 44.1803809, lng: 15.1564708, type: ['šljunak'], tags: ['mirna'], free: true },
  { id: 'petrcane-3', name: { hr: 'Petrčane — uvala', en: 'Petrčane Cove Beach', de: 'Strand Petrčane Bucht', it: 'Caletta Petrčane' }, lat: 44.1740108, lng: 15.1742552, type: ['kamen', 'šljunak'], tags: ['mirna', 'divlja'], free: true },
  { id: 'st-peter', name: { hr: 'Plaža Sv. Petra', en: "St. Peter's Beach", de: 'St. Peter Strand', it: 'Spiaggia San Pietro' }, lat: 44.1590224, lng: 15.194181, type: ['šljunak'], tags: ['mirna'], free: true },
  { id: 'diklo-1', name: { hr: 'Diklo Beach', en: 'Diklo Beach', de: 'Diklo Strand', it: 'Spiaggia Diklo' }, lat: 44.1565266, lng: 15.1958568, type: ['šljunak', 'kamen'], tags: [], free: true },
  { id: 'diklo-2', name: { hr: 'Plaža Diklo', en: 'Plaza Diklo', de: 'Strand Diklo', it: 'Spiaggia Diklo centro' }, lat: 44.1443743, lng: 15.2111092, type: ['šljunak'], tags: [], free: true },
  { id: 'tamarisi', name: { hr: 'Plaža 7 tamarisa', en: '7 Tamarisks Beach', de: 'Strand 7 Tamarisken', it: 'Spiaggia 7 Tamerici' }, lat: 44.1385531, lng: 15.2133252, type: ['šljunak', 'kamen'], tags: ['mirna', 'obitelj'], free: true },
  { id: 'borik-1', name: { hr: 'Borik Beach', en: 'Borik Beach', de: 'Borik Strand', it: 'Spiaggia Borik' }, lat: 44.1374087, lng: 15.2112952, type: ['šljunak'], tags: ['sadržaji', 'obitelj'], free: true },
  { id: 'borik-2', name: { hr: 'Beach Borik', en: 'Beach Borik', de: 'Strand Borik 2', it: 'Spiaggia Borik 2' }, lat: 44.1352195, lng: 15.2093945, type: ['šljunak'], tags: ['obitelj'], free: true },
  { id: 'borik-sandy', name: { hr: 'Borik pješčana plaža', en: 'Borik Sandy Beach', de: 'Borik Sandstrand', it: 'Spiaggia sabbiosa Borik' }, lat: 44.1334377, lng: 15.2099326, type: ['pijesak'], tags: ['pijesak', 'obitelj'], free: true },
  { id: 'borik-3', name: { hr: 'Plaža Borik', en: 'Plaža Borik', de: 'Strand Borik 3', it: 'Spiaggia Borik 3' }, lat: 44.1334074, lng: 15.2068731, type: ['šljunak'], tags: [], free: true },
  { id: 'puntamika-wild', name: { hr: 'Wild Beach Puntamika', en: 'Wild Beach Puntamika', de: 'Wilder Strand Puntamika', it: 'Spiaggia selvaggia Puntamika' }, lat: 44.1330695, lng: 15.2030541, type: ['kamen'], tags: ['divlja', 'mirna'], free: true },
  { id: 'puntamika-rt', name: { hr: 'Plaža Rt Puntamika', en: 'Cape Puntamika Beach', de: 'Strand Kap Puntamika', it: 'Spiaggia Capo Puntamika' }, lat: 44.1302494, lng: 15.2042611, type: ['kamen', 'šljunak'], tags: ['mirna'], free: true },
  { id: 'zadar-strand', name: { hr: 'Plaža Zadar', en: 'Zadar Beach', de: 'Zadar Strand', it: 'Spiaggia Zadar' }, lat: 44.1302063, lng: 15.2081173, type: ['šljunak'], tags: [], free: true },
  { id: 'uskok', name: { hr: 'Plaža Uskok', en: 'Uskok Beach', de: 'Uskok Strand', it: 'Spiaggia Uskok' }, lat: 44.1280402, lng: 15.2125913, type: ['šljunak', 'kamen'], tags: [], free: true },
  { id: 'maestrala', name: { hr: 'Beach Maestrala', en: 'Maestrala Beach', de: 'Maestrala Strand', it: 'Spiaggia Maestrala' }, lat: 44.1227313, lng: 15.223181, type: ['šljunak'], tags: ['mirna'], free: true },
  { id: 'mini-beach', name: { hr: 'Mini Beach', en: 'Mini Beach', de: 'Mini Strand', it: 'Mini Spiaggia' }, lat: 44.1092867, lng: 15.2296926, type: ['šljunak'], tags: ['mirna', 'mala'], free: true },
  { id: 'golden-wave', name: { hr: 'Golden Wave Beach', en: 'Golden Wave Beach', de: 'Golden Wave Strand', it: 'Spiaggia Golden Wave' }, lat: 44.1076861, lng: 15.231683, type: ['šljunak'], tags: [], free: true },
  { id: 'kolovare', name: { hr: 'Plaža Kolovare', en: 'Kolovare Beach', de: 'Kolovare Strand', it: 'Spiaggia Kolovare' }, lat: 44.1046776, lng: 15.2341251, type: ['šljunak', 'beton'], tags: ['sadržaji', 'grad', 'popularna'], free: true },
  { id: 'divna-draga', name: { hr: 'Plaža Divna Draga', en: 'Divna Draga Beach', de: 'Divna Draga Strand', it: 'Spiaggia Divna Draga' }, lat: 44.1013179, lng: 15.2384914, type: ['šljunak'], tags: ['mirna'], free: true },
  { id: 'karma', name: { hr: 'Beach Karma', en: 'Beach Karma', de: 'Karma Strand', it: 'Spiaggia Karma' }, lat: 44.1009948, lng: 15.2393712, type: ['šljunak'], tags: ['bar', 'sadržaji'], free: true },
  { id: 'podbrig', name: { hr: 'Plaža Podbrig', en: 'Podbrig Beach', de: 'Podbrig Strand', it: 'Spiaggia Podbrig' }, lat: 44.0978622, lng: 15.2456779, type: ['šljunak', 'kamen'], tags: ['mirna'], free: true },
  { id: 'punta-bajlo', name: { hr: 'Punta Bajlo Beach', en: 'Punta Bajlo Beach', de: 'Punta Bajlo Strand', it: 'Spiaggia Punta Bajlo' }, lat: 44.0954317, lng: 15.2481759, type: ['šljunak'], tags: ['mirna'], free: true },
  { id: 'dog-beach', name: { hr: 'Dog Beach (plaža za pse)', en: 'Dog Beach', de: 'Hundestrand', it: 'Spiaggia per cani' }, lat: 44.0962337, lng: 15.2522867, type: ['šljunak', 'kamen'], tags: ['psi'], free: true },
  { id: 'lipauska', name: { hr: 'Beach Lipauska', en: 'Lipauska Beach', de: 'Lipauska Strand', it: 'Spiaggia Lipauska' }, lat: 44.0806251, lng: 15.2767689, type: ['šljunak'], tags: ['mirna'], free: true },
  { id: 'bibinje-1', name: { hr: 'Plaža Bibinje', en: 'Bibinje Beach', de: 'Bibinje Strand', it: 'Spiaggia Bibinje' }, lat: 44.0765983, lng: 15.277712, type: ['šljunak'], tags: ['obitelj'], free: true },
  { id: 'branimirova', name: { hr: 'Plaža Branimirova obala', en: 'Branimirova Beach', de: 'Branimirova Strand', it: 'Spiaggia Branimirova' }, lat: 44.0734433, lng: 15.2807203, type: ['šljunak'], tags: [], free: true },
  { id: 'bibinje-2', name: { hr: 'Beach Bibinje 2', en: 'Beach Bibinje 2', de: 'Strand Bibinje 2', it: 'Spiaggia Bibinje 2' }, lat: 44.0717041, lng: 15.2820706, type: ['šljunak'], tags: [], free: true },
  { id: 'punta-ruzica', name: { hr: 'Plaža Punta Ružica', en: 'Punta Ružica Beach', de: 'Punta Ružica Strand', it: 'Spiaggia Punta Ružica' }, lat: 44.0653661, lng: 15.281793, type: ['šljunak', 'kamen'], tags: ['mirna'], free: true },
  { id: 'punta-bibinje', name: { hr: 'Plaža Punta Bibinje', en: 'Punta Bibinje Beach', de: 'Punta Bibinje Strand', it: 'Spiaggia Punta Bibinje' }, lat: 44.0526099, lng: 15.2963295, type: ['šljunak'], tags: ['mirna'], free: true },
  { id: 'punta-sukosan', name: { hr: 'Beach Punta Sukošan', en: 'Beach Punta Sukošan', de: 'Strand Punta Sukošan', it: 'Spiaggia Punta Sukošan' }, lat: 44.0452983, lng: 15.3002973, type: ['šljunak'], tags: ['mirna'], free: true },
  { id: 'childrens-paradise', name: { hr: 'Dječji raj', en: "Children's Paradise Beach", de: 'Kinderstrand', it: 'Paradiso dei bambini' }, lat: 44.0410589, lng: 15.3078768, type: ['šljunak'], tags: ['djeca', 'obitelj', 'plitko'], free: true },
  { id: 'makarska-sukosan', name: { hr: 'Makarska Beach Sukošan', en: 'Makarska Beach Sukošan', de: 'Makarska Strand Sukošan', it: 'Spiaggia Makarska Sukošan' }, lat: 44.0360849, lng: 15.3300748, type: ['šljunak'], tags: [], free: true },
  { id: 'mulic', name: { hr: 'Beach Mulić', en: 'Beach Mulić', de: 'Strand Mulić', it: 'Spiaggia Mulić' }, lat: 44.0826665, lng: 15.187456, type: ['šljunak', 'kamen'], tags: ['mirna'], free: true },
  { id: 'jaz', name: { hr: 'Beach Jaz', en: 'Beach Jaz', de: 'Strand Jaz', it: 'Spiaggia Jaz' }, lat: 44.0848562, lng: 15.1834629, type: ['šljunak'], tags: ['mirna'], free: true },
];

const TAG_LABELS: Record<string, Record<string, string>> = {
  pijesak: { hr: '🏖️ Pijesak', en: '🏖️ Sandy', de: '🏖️ Sand', it: '🏖️ Sabbia' },
  mirna: { hr: '🌊 Mirna', en: '🌊 Quiet', de: '🌊 Ruhig', it: '🌊 Tranquilla' },
  obitelj: { hr: '👨‍👩‍👧 Obitelj', en: '👨‍👩‍👧 Family', de: '👨‍👩‍👧 Familie', it: '👨‍👩‍👧 Famiglia' },
  sadržaji: { hr: '🏄 Sadržaji', en: '🏄 Facilities', de: '🏄 Einrichtungen', it: '🏄 Servizi' },
  psi: { hr: '🐕 Psi OK', en: '🐕 Dogs OK', de: '🐕 Hunde OK', it: '🐕 Cani OK' },
  djeca: { hr: '👶 Za djecu', en: '👶 Kids', de: '👶 Kinder', it: '👶 Bambini' },
  bar: { hr: '🍹 Bar', en: '🍹 Bar', de: '🍹 Bar', it: '🍹 Bar' },
  grad: { hr: '🏙️ Gradska', en: '🏙️ City', de: '🏙️ Stadt', it: '🏙️ Città' },
  popularna: { hr: '⭐ Popularna', en: '⭐ Popular', de: '🌿 Beliebt', it: '⭐ Popolare' },
  divlja: { hr: '🌿 Divlja', en: '🌿 Wild', de: '🌿 Wild', it: '🌿 Selvaggia' },
  plitko: { hr: '🏊 Plitko', en: '🏊 Shallow', de: '🏊 Flach', it: '🏊 Poco profondo' },
};

const FILTERS = [
  { key: 'all', label: { hr: 'Sve', en: 'All', de: 'Alle', it: 'Tutte' } },
  { key: 'pijesak', label: { hr: '🏖️ Pijesak', en: '🏖️ Sandy', de: '🏖️ Sand', it: '🏖️ Sabbia' } },
  { key: 'obitelj', label: { hr: '👨‍👩‍👧 Obitelj', en: '👨‍👩‍👧 Family', de: '👨‍👩‍👧 Familie', it: '👨‍👩‍👧 Famiglia' } },
  { key: 'mirna', label: { hr: '🌊 Mirna', en: '🌊 Quiet', de: '🌊 Ruhig', it: '🌊 Tranquilla' } },
  { key: 'psi', label: { hr: '🐕 Psi', en: '🐕 Dogs', de: '🐕 Hunde', it: '🐕 Cani' } },
  { key: 'divlja', label: { hr: '🌿 Divlje', en: '🌿 Wild', de: '🌿 Wild', it: '🌿 Selvagge' } },
];

export default function Place() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const lang = language as string;
  const [activeFilter, setActiveFilter] = useState('all');
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, []);

  function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
  }

  const beachesWithDist = BEACHES.map(b => ({
    ...b,
    distance: userLocation ? getDistance(userLocation.lat, userLocation.lng, b.lat, b.lng) : null
  })).sort((a, b) => (a.distance ?? 99999) - (b.distance ?? 99999));

  const filtered = activeFilter === 'all'
    ? beachesWithDist
    : beachesWithDist.filter(b => b.tags.includes(activeFilter) || b.type.includes(activeFilter));

  const getTypeLabel = (types: string[]) => {
    const map: Record<string, string> = { pijesak: '🏖️', šljunak: '🪨', kamen: '🪨', beton: '🏗️' };
    return types.map(t => map[t] || t).join(' ');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-foreground">🏖️ Plaže Zadra</h1>
              <p className="text-[11px] text-muted-foreground">{filtered.length} plaža · Petrčane → Sukošan</p>
            </div>
          </div>
          <LanguageSelector />
        </div>
        <div className="max-w-lg mx-auto px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setActiveFilter(f.key)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${activeFilter === f.key ? 'bg-accent text-white' : 'bg-secondary text-muted-foreground'}`}>
              {f.label[lang] || f.label.hr}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pb-8 pt-4 space-y-3">
        {filtered.map((beach, idx) => (
          <div key={beach.id} className="rounded-2xl bg-card border border-border overflow-hidden">
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-muted-foreground font-mono">{idx + 1}.</span>
                    <h3 className="font-semibold text-foreground text-sm truncate">
                      {beach.name[lang] || beach.name.hr}
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {getTypeLabel(beach.type)} {beach.type.join(' / ')}
                    </span>
                    {(beach as any).distance !== null && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                        📍 {(beach as any).distance < 1000 ? `${(beach as any).distance}m` : `${((beach as any).distance / 1000).toFixed(1)}km`}
                      </span>
                    )}
                    {beach.free && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                        ✓ {lang === 'hr' ? 'Besplatna' : lang === 'de' ? 'Kostenlos' : lang === 'it' ? 'Gratuita' : 'Free'}
                      </span>
                    )}
                    {beach.tags.map(tag => (
                      <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                        {TAG_LABELS[tag]?.[lang] || TAG_LABELS[tag]?.hr || tag}
                      </span>
                    ))}
                  </div>
                </div>
                
                  <a href={`https://maps.google.com/maps/dir/?api=1&destination=${beach.lat},${beach.lng}&travelmode=driving`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
                  >
                  <Navigation className="h-3.5 w-3.5" />
                  Navigate
                  </a>
              </div>
            </div>
          </div>
        ))}
      </main>
      <Footer />
    </div>
  );
}
