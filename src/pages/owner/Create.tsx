import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LanguageSelector } from '@/components/LanguageSelector';
import { ArrowLeft, Building2, MapPin, Clock, Globe, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const CATEGORIES = [
  { key: 'ugostiteljstvo', label: '🍽️ Ugostiteljstvo', sub: ['Kafić', 'Restoran', 'Bar', 'Pizzeria', 'Slastičarna', 'Brza hrana', 'Catering'] },
  { key: 'smjestaj', label: '🏨 Smještaj', sub: ['Hotel', 'Apart-hotel', 'Apartman', 'Hostel', 'Kamp'] },
  { key: 'trgovina', label: '🛒 Trgovina', sub: ['Prehrambena', 'Moda & obuća', 'Ljekarna', 'Drogerija', 'Cvjećarna', 'Suveniri', 'Sport & oprema'] },
  { key: 'obrti', label: '🔧 Obrti & majstori', sub: ['Vodoinstalater', 'Električar', 'Soboslikar', 'Keramičar', 'Staklar', 'Zidar', 'Vulkanizer', 'Autoservis', 'Klima serviser'] },
  { key: 'ljepota', label: '💇 Ljepota & wellness', sub: ['Frizer', 'Kozmetičar', 'Manikura/pedikura', 'Masaža', 'Teretana', 'Yoga/pilates', 'Tattoo studio'] },
  { key: 'zdravlje', label: '🏥 Zdravlje', sub: ['Opća praksa', 'Stomatolog', 'Dentalna radiologija', 'Oralna kirurgija', 'Ortodoncija', 'Pedijatrija', 'Fizioterapija', 'Zubotehničar', 'Veterinar', 'Ljekarna', 'Oftalmologija', 'Dermatologija', 'Psihologija', 'Ginekologija'] },
  { key: 'poslovne', label: '⚖️ Poslovne usluge', sub: ['Odvjetnik', 'Javni bilježnik', 'Računovođa', 'Agencija za nekretnine', 'Osiguranje', 'Prevoditelj'] },
  { key: 'prijevoz', label: '🚗 Prijevoz', sub: ['Taxi', 'Rent-a-car', 'Iznajmljivanje skutera', 'Transfer aerodrom', 'Brodski prijevoz'] },
  { key: 'turizam', label: '🌊 Turizam', sub: ['Turistička agencija', 'Ronjenje', 'Izleti', 'Kajak', 'Surf', 'Ribolov'] },
  { key: 'projektiranje', label: '🏗️ Projektiranje', sub: ['Arhitekt', 'Geodet', 'Građevinski inženjer', 'Interior dizajner'] },
  { key: 'kreativne', label: '📸 Kreativne usluge', sub: ['Fotograf', 'Videograf', 'Grafički dizajner', 'Web dizajner', 'Marketing agencija'] },
  { key: 'obrazovanje', label: '🎓 Obrazovanje', sub: ['Škola stranih jezika', 'Privatne instrukcije', 'Glazbena škola', 'Plesna škola', 'Vrtić'] },
  { key: 'ljubimci', label: '🐾 Kućni ljubimci', sub: ['Veterinar', 'Groomer', 'Hotel za ljubimce', 'Trgovina za ljubimce'] },
];

const DAYS = [
  { key: 'mon', label: 'Ponedjeljak' },
  { key: 'tue', label: 'Utorak' },
  { key: 'wed', label: 'Srijeda' },
  { key: 'thu', label: 'Četvrtak' },
  { key: 'fri', label: 'Petak' },
  { key: 'sat', label: 'Subota' },
  { key: 'sun', label: 'Nedjelja' },
];

export default function OwnerCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'info' | 'category' | 'hours' | 'location'>('info');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSub, setSelectedSub] = useState('');
  const [locating, setLocating] = useState(false);
  const [bulkHours, setBulkHours] = useState('');
  const [showMap, setShowMap] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    website: '',
    forte: '',
    lat: null as number | null,
    lng: null as number | null,
    hours: { mon: '', tue: '', wed: '', thu: '', fri: '', sat: '', sun: '' } as Record<string, string>,
  });

  useEffect(() => {
    if (!showMap || !mapRef.current || form.lat) return;
    if (leafletMapRef.current) return;

    const L = (window as any).L;
    if (!L) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => initMap();
      document.head.appendChild(script);
    } else {
      initMap();
    }

    function initMap() {
      const map = (window as any).L.map(mapRef.current!, { zoomControl: true }).setView([44.1194, 15.2314], 16);
      (window as any).L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
      leafletMapRef.current = map;
      let marker: any = null;
      map.on('click', (e: any) => {
        if (marker) map.removeLayer(marker);
        marker = (window as any).L.marker([e.latlng.lat, e.latlng.lng]).addTo(map);
        setForm(f => ({ ...f, lat: e.latlng.lat, lng: e.latlng.lng }));
      });
    }
  }, [showMap]);

  const applyBulk = (days: string[]) => {
    if (!bulkHours) return;
    setForm(f => ({
      ...f,
      hours: { ...f.hours, ...Object.fromEntries(days.map(d => [d, bulkHours])) }
    }));
  };

  const handleLocate = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setForm(f => ({ ...f, lat: pos.coords.latitude, lng: pos.coords.longitude }));
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true }
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/owner/login'); return; }

      const { error } = await supabase.from('pending_places').insert({
        proposed_name: form.name,
        proposed_address: form.address,
        category: selectedCategory,
        phone: form.phone,
        website: form.website,
        notes: [
          form.description,
          selectedSub ? `Podkategorija: ${selectedSub}` : '',
          form.forte ? `Forte: ${form.forte}` : '',
          form.hours ? `Radno vrijeme: ${form.hours}` : '',
        ].filter(Boolean).join(' | ') || null,
        lat: form.lat || null,
        lng: form.lng || null,
        fingerprint_hash: user.id,
        submitter_email: user.email,
        status: 'pending',
      });

      if (error) throw error;

      await supabase.functions.invoke('send-email', {
        body: {
          to: 'admin@zadariq.city',
          subject: '[ZadarIQ] Novi objekt čeka odobrenje',
          html: `
            <div style="font-family:sans-serif;padding:24px;background:#0f0f1a;color:#fff">
              <h2 style="color:#fff">Novi objekt za odobrenje</h2>
              <p><b>Naziv:</b> ${form.name}</p>
              <p><b>Adresa:</b> ${form.address}</p>
              <p><b>Kategorija:</b> ${selectedCategory} / ${selectedSub}</p>
              <p><b>Forte:</b> ${form.forte}</p>
              <p><b>Korisnik:</b> ${user.email}</p>
              <p><b>Lokacija:</b> ${form.lat ? `${form.lat}, ${form.lng}` : 'Nije postavljena'}</p>
            </div>
          `
        }
      });

      navigate('/owner/dashboard');
    } catch (err: any) {
      setError(err.message || 'Greška pri spremanju');
    }
    setLoading(false);
  };

  // STEP 1: INFO
  if (step === 'info') return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate('/owner/dashboard')} className="p-1.5 rounded-lg hover:bg-secondary">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="text-center">
            <h1 className="font-bold text-sm">Novi objekt</h1>
            <p className="text-[10px] text-muted-foreground">Korak 1 od 4 — Osnovni podaci</p>
          </div>
          <LanguageSelector />
        </div>
      </header>
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {[
          { key: 'name', label: 'Naziv objekta *', placeholder: 'npr. Frizerski salon Ana', icon: Building2 },
          { key: 'address', label: 'Adresa *', placeholder: 'Ulica i broj, Zadar', icon: MapPin },
          { key: 'phone', label: 'Telefon', placeholder: '023 XXX XXX ili +385 9X XXX XXXX', icon: Phone },
          { key: 'website', label: 'Web / Instagram', placeholder: 'https://...', icon: Globe },
        ].map(({ key, label, placeholder, icon: Icon }) => (
          <div key={key}>
            <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
            <div className="relative">
              <Icon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input type="text" value={(form as any)[key]}
                onChange={e => setForm(f => ({...f, [key]: e.target.value}))}
                placeholder={placeholder}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:border-primary" />
            </div>
          </div>
        ))}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Kratki opis</label>
          <textarea value={form.description}
            onChange={e => setForm(f => ({...f, description: e.target.value}))}
            placeholder="2-3 rečenice o vašem objektu..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:border-primary resize-none" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Vaš forte — po čemu ste posebni?</label>
          <input type="text" value={form.forte}
            onChange={e => setForm(f => ({...f, forte: e.target.value}))}
            placeholder="npr. Jedini veganski restoran u centru Zadra"
            className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:border-primary" />
        </div>
        <button onClick={() => setStep('category')} disabled={!form.name || !form.address}
          className="w-full py-4 rounded-2xl bg-primary text-white font-bold hover:bg-primary/90 disabled:opacity-40">
          Dalje →
        </button>
      </div>
    </div>
  );

  // STEP 2: CATEGORY
  if (step === 'category') return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => setStep('info')} className="p-1.5 rounded-lg hover:bg-secondary">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="text-center">
            <h1 className="font-bold text-sm">Djelatnost</h1>
            <p className="text-[10px] text-muted-foreground">Korak 2 od 4 — Odaberite kategoriju</p>
          </div>
          <LanguageSelector />
        </div>
      </header>
      <div className="max-w-lg mx-auto px-4 py-6 space-y-2">
        {CATEGORIES.map(cat => (
          <div key={cat.key}>
            <button onClick={() => { setSelectedCategory(cat.key); setSelectedSub(''); }}
              className={`w-full p-3 rounded-xl text-left text-sm font-medium border transition-colors ${selectedCategory === cat.key ? 'bg-primary/10 border-primary text-primary' : 'bg-card border-border text-foreground hover:border-primary/50'}`}>
              {cat.label}
            </button>
            {selectedCategory === cat.key && (
              <div className="flex flex-wrap gap-2 mt-2 px-2 pb-2">
                {cat.sub.map(s => (
                  <button key={s} onClick={() => setSelectedSub(s)}
                    className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${selectedSub === s ? 'bg-primary text-white border-primary' : 'bg-secondary border-border text-muted-foreground hover:border-primary/50'}`}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        <div className="pt-2">
          <button onClick={() => setStep('hours')} disabled={!selectedCategory || !selectedSub}
            className="w-full py-4 rounded-2xl bg-primary text-white font-bold hover:bg-primary/90 disabled:opacity-40">
            Dalje →
          </button>
        </div>
      </div>
    </div>
  );

  // STEP 3: HOURS
  if (step === 'hours') return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => setStep('category')} className="p-1.5 rounded-lg hover:bg-secondary">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="text-center">
            <h1 className="font-bold text-sm">Radno vrijeme</h1>
            <p className="text-[10px] text-muted-foreground">Korak 3 od 4</p>
          </div>
          <LanguageSelector />
        </div>
      </header>
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* Bulk unos */}
        <div className="p-4 rounded-2xl bg-secondary border border-border">
          <p className="text-xs font-medium text-foreground mb-3">⚡ Brzi unos — postavi isto radno vrijeme za više dana</p>
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input type="text" value={bulkHours}
                onChange={e => setBulkHours(e.target.value)}
                placeholder="08:00–20:00"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary" />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => applyBulk(['mon','tue','wed','thu','fri'])}
              className="px-3 py-2 rounded-xl bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20">
              Pon – Pet
            </button>
            <button onClick={() => applyBulk(['mon','tue','wed','thu','fri','sat'])}
              className="px-3 py-2 rounded-xl bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20">
              Pon – Sub
            </button>
            <button onClick={() => applyBulk(['mon','tue','wed','thu','fri','sat','sun'])}
              className="px-3 py-2 rounded-xl bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20">
              Svih 7 dana
            </button>
            <button onClick={() => setForm(f => ({ ...f, hours: { mon:'', tue:'', wed:'', thu:'', fri:'', sat:'—', sun:'—' } }))}
              className="px-3 py-2 rounded-xl bg-secondary border border-border text-muted-foreground text-xs hover:border-primary/50">
              Reset
            </button>
          </div>
        </div>

        {/* Po danima */}
        <div className="space-y-2">
          {DAYS.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-28 shrink-0">{label}</span>
              <input type="text"
                value={form.hours[key] || ''}
                onChange={e => setForm(f => ({ ...f, hours: { ...f.hours, [key]: e.target.value } }))}
                placeholder="08:00–20:00 ili —"
                className="flex-1 px-3 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:border-primary" />
              <button onClick={() => setForm(f => ({ ...f, hours: { ...f.hours, [key]: '—' } }))}
                className="text-[10px] text-muted-foreground hover:text-red-400 shrink-0 whitespace-nowrap">
                Zatv.
              </button>
            </div>
          ))}
        </div>

        <button onClick={() => setStep('location')}
          className="w-full py-4 rounded-2xl bg-primary text-white font-bold hover:bg-primary/90">
          Dalje →
        </button>
      </div>
    </div>
  );

  // STEP 4: LOCATION
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => setStep('hours')} className="p-1.5 rounded-lg hover:bg-secondary">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="text-center">
            <h1 className="font-bold text-sm">Lokacija</h1>
            <p className="text-[10px] text-muted-foreground">Korak 4 od 4</p>
          </div>
          <LanguageSelector />
        </div>
      </header>
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20">
          <p className="text-xs text-muted-foreground leading-relaxed">
            📍 Lokacija je opcionalna ali preporučena — omogućuje pojavu vašeg objekta na Radar karti gdje vas korisnici mogu pronaći i navigirati do vas.
            <span className="block mt-2 font-medium text-foreground">⚠️ Lokacija se postavlja jednom. Svaka promjena zahtijeva admin odobrenje.</span>
            <span className="block mt-1 text-[11px]">GPS lokacija sprema se s vremenskom oznakom kao dodatni dokaz autentičnosti.</span>
          </p>
        </div>

        {/* Buttons */}
        {!form.lat && !form.lng && (
          <div className="space-y-2">
            <button onClick={handleLocate} disabled={locating}
              className="w-full py-4 rounded-2xl bg-secondary border border-border text-foreground font-medium flex items-center justify-center gap-2 hover:border-primary/50 disabled:opacity-50 transition-colors">
              <MapPin className="h-5 w-5 text-primary" />
              {locating ? 'Lociranje...' : '📍 Lociraj me sada (preporučeno)'}
            </button>
            <button onClick={() => setShowMap(true)}
              className="w-full py-4 rounded-2xl bg-secondary border border-border text-foreground font-medium flex items-center justify-center gap-2 hover:border-primary/50 transition-colors">
              🗺️ Postavi pin na karti
            </button>
          </div>
        )}

        {/* Map picker */}
        {showMap && !form.lat && (
          <div className="rounded-2xl overflow-hidden border border-border">
            <div className="p-3 bg-secondary text-xs text-muted-foreground">
              👆 Kliknite na karti da postavite pin na lokaciju vašeg objekta
            </div>
            <div ref={mapRef} style={{height: '300px'}} />
          </div>
        )}

        {form.lat && form.lng && (
          <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20">
            <p className="text-green-400 text-sm font-medium">✓ Lokacija postavljena</p>
            <p className="text-xs text-muted-foreground mt-1">{form.lat.toFixed(6)}, {form.lng.toFixed(6)}</p>
            <button onClick={() => { setForm(f => ({...f, lat: null, lng: null})); setShowMap(false); }}
              className="text-[10px] text-red-400 mt-2 hover:underline block">
              Promijeni lokaciju
            </button>
          </div>
        )}

        <button onClick={() => { setForm(f => ({...f, lat: null, lng: null})); handleSubmit(); }}
          className="w-full py-3 text-muted-foreground text-sm underline hover:text-foreground">
          Preskoči — dodat ću lokaciju kasnije
        </button>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
        )}

        <button onClick={handleSubmit} disabled={loading}
          className="w-full py-4 rounded-2xl bg-primary text-white font-bold hover:bg-primary/90 disabled:opacity-50">
          {loading ? 'Slanje na pregled...' : '✓ Pošalji na odobrenje'}
        </button>
      </div>
    </div>
  );
}
