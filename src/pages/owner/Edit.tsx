import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LanguageSelector } from '@/components/LanguageSelector';
import { ArrowLeft, Save, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function OwnerEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: '',
    address: '',
    phone: '',
    website: '',
    description: '',
    forte: '',
    hours: {
      Ponedjeljak: '', Utorak: '', Srijeda: '',
      Četvrtak: '', Petak: '', Subota: '', Nedjelja: ''
    }
  });

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/owner/login'); return; }

      // Check ownership
      const { data: ownership } = await supabase
        .from('business_ownership')
        .select('*')
        .eq('business_id', id)
        .eq('owner_user_id', user.id)
        .maybeSingle();

      if (!ownership) {
        navigate('/owner/dashboard');
        return;
      }

      // Load from pending_places if exists
      const { data: place } = await supabase
        .from('pending_places')
        .select('*')
        .eq('submitter_email', user.email)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (place) {
        const notes = place.notes ? (() => { try { return JSON.parse(place.notes); } catch { return {}; } })() : {};
        setForm({
          name: place.proposed_name || '',
          address: place.proposed_address || '',
          phone: place.phone || '',
          website: place.website || '',
          description: notes.description || '',
          forte: notes.forte || '',
          hours: notes.hours || {
            Ponedjeljak: '', Utorak: '', Srijeda: '',
            Četvrtak: '', Petak: '', Subota: '', Nedjelja: ''
          }
        });
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('pending_places').insert({
        proposed_name: form.name,
        proposed_address: form.address,
        phone: form.phone,
        website: form.website,
        submitter_email: user.email,
        category: 'zdravlje',
        status: 'pending',
        fingerprint_hash: user.id,
        notes: JSON.stringify({
          description: form.description,
          forte: form.forte,
          hours: form.hours,
        })
      });

      // Notify admin
      await supabase.functions.invoke('send-email', {
        body: {
          to: 'admin@zadariq.city',
          subject: `[ZadarIQ] Ažurirani podaci — ${form.name}`,
          html: `<div style="font-family:sans-serif;padding:24px"><h2>Vlasnik ažurirao profil</h2><p><b>Objekt:</b> ${form.name}</p><p><b>Korisnik:</b> ${user.email}</p></div>`
        }
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Greška');
    }
    setSaving(false);
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Učitavanje...</p></div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate('/owner/dashboard')} className="p-1.5 rounded-lg hover:bg-secondary">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="text-center">
            <h1 className="font-bold text-sm">Uredi profil</h1>
            <p className="text-[10px] text-muted-foreground">{id}</p>
          </div>
          <LanguageSelector />
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 leading-relaxed">
          ⚠️ Promjene će biti pregledane od strane admina prije objave. Bit ćete obaviješteni emailom.
        </div>

        {/* Basic info */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-foreground">Osnovni podaci</h3>
          {[
            { key: 'name', label: 'Naziv objekta', placeholder: 'Naziv...' },
            { key: 'address', label: 'Adresa', placeholder: 'Ulica i broj...' },
            { key: 'phone', label: 'Telefon', placeholder: '+385...' },
            { key: 'website', label: 'Web / Instagram', placeholder: 'https://...' },
          ].map(f => (
            <div key={f.key}>
              <label className="text-xs text-muted-foreground mb-1 block">{f.label}</label>
              <input type="text" value={(form as any)[f.key]}
                onChange={e => setForm(prev => ({...prev, [f.key]: e.target.value}))}
                placeholder={f.placeholder}
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:border-primary" />
            </div>
          ))}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Kratki opis</label>
            <textarea value={form.description}
              onChange={e => setForm(f => ({...f, description: e.target.value}))}
              rows={2} placeholder="Opis objekta..."
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:border-primary resize-none" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Po čemu ste posebni?</label>
            <input type="text" value={form.forte}
              onChange={e => setForm(f => ({...f, forte: e.target.value}))}
              placeholder="Vaša prednost..."
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:border-primary" />
          </div>
        </div>

        {/* Hours */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm text-foreground">Radno vrijeme</h3>
          {Object.keys(form.hours).map(day => (
            <div key={day} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-24 shrink-0">{day}</span>
              <input type="text"
                value={(form.hours as any)[day]}
                onChange={e => setForm(f => ({...f, hours: {...f.hours, [day]: e.target.value}}))}
                placeholder="08:00-16:00 ili —"
                className="flex-1 px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-xs focus:outline-none focus:border-primary" />
            </div>
          ))}
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        {saved && (
          <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm text-center">
            ✓ Promjene poslane na pregled!
          </div>
        )}

        <button onClick={handleSave} disabled={saving}
          className="w-full py-4 rounded-2xl bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
          <Save className="h-4 w-4" />
          {saving ? 'Spremanje...' : 'Pošalji promjene na pregled'}
        </button>

      </div>
    </div>
  );
}
