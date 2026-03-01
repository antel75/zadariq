import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LanguageSelector } from '@/components/LanguageSelector';
import { ArrowLeft, Plus, Trash2, Calendar, Tag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function OwnerOffers() {
  const navigate = useNavigate();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [user, setUser] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [form, setForm] = useState({
    business_id: '',
    title: '',
    description: '',
    valid_from: new Date().toISOString().split('T')[0],
    valid_to: '',
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { navigate('/owner/login'); return; }
      setUser(user);
      loadData(user.id);
    });
  }, []);

  const loadData = async (userId) => {
    const { data: owned } = await supabase
      .from('business_ownership')
      .select('business_id')
      .eq('owner_user_id', userId);
    setBusinesses(owned || []);

    const { data: offersData } = await supabase
      .from('business_offers')
      .select('*')
      .eq('owner_user_id', userId)
      .order('created_at', { ascending: false });
    setOffers(offersData || []);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!form.title || !form.business_id || !form.valid_to) {
      setError('Ispunite sva obavezna polja'); return;
    }
    setSaving(true);
    setError('');
    try {
      const { error } = await supabase.from('business_offers').insert({
        ...form,
        owner_user_id: user.id,
        active: true,
      });
      if (error) throw error;
      setShowForm(false);
      setForm({ business_id: '', title: '', description: '', valid_from: new Date().toISOString().split('T')[0], valid_to: '' });
      loadData(user.id);
    } catch (err) {
      setError(err.message || 'Greška');
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    await supabase.from('business_offers').delete().eq('id', id);
    setOffers(o => o.filter(x => x.id !== id));
  };

  const handleToggle = async (offer) => {
    await supabase.from('business_offers').update({ active: !offer.active }).eq('id', offer.id);
    setOffers(o => o.map(x => x.id === offer.id ? {...x, active: !x.active} : x));
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate('/owner/dashboard')} className="p-1.5 rounded-lg hover:bg-secondary">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="text-center">
            <h1 className="font-bold text-sm">Moje ponude</h1>
            <p className="text-[10px] text-muted-foreground">Tjedne i dnevne promocije</p>
          </div>
          <LanguageSelector />
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 text-xs text-muted-foreground leading-relaxed">
          📢 Aktivne ponude prikazuju se na homepageu aplikacije i vidljive su svim korisnicima ZadarIQ-a.
          Dostupno za ⭐⭐ i ⭐⭐⭐ verificirane profile.
        </div>

        <button onClick={() => setShowForm(true)}
          className="w-full py-3 rounded-2xl bg-primary text-white font-medium flex items-center justify-center gap-2 hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          Dodaj novu ponudu
        </button>

        {showForm && (
          <div className="p-5 rounded-2xl bg-card border border-border space-y-4">
            <h3 className="font-semibold text-foreground text-sm">Nova ponuda</h3>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Objekt *</label>
              <select value={form.business_id}
                onChange={e => setForm(f => ({...f, business_id: e.target.value}))}
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:border-primary">
                <option value="">Odaberite objekt...</option>
                {businesses.map(b => (
                  <option key={b.business_id} value={b.business_id}>{b.business_id}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Naziv ponude *</label>
              <input type="text" value={form.title}
                onChange={e => setForm(f => ({...f, title: e.target.value}))}
                placeholder="npr. Happy hour 17-19h — 20% popust"
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:border-primary" />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Opis (opcionalno)</label>
              <textarea value={form.description}
                onChange={e => setForm(f => ({...f, description: e.target.value}))}
                placeholder="Dodatne informacije o ponudi..."
                rows={2}
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:border-primary resize-none" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Od *</label>
                <input type="date" value={form.valid_from}
                  onChange={e => setForm(f => ({...f, valid_from: e.target.value}))}
                  className="w-full px-3 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Do *</label>
                <input type="date" value={form.valid_to}
                  onChange={e => setForm(f => ({...f, valid_to: e.target.value}))}
                  className="w-full px-3 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:border-primary" />
              </div>
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <div className="flex gap-3">
              <button onClick={() => setShowForm(false)}
                className="flex-1 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm font-medium">
                Odustani
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                {saving ? 'Spremanje...' : 'Objavi ponudu'}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-center text-muted-foreground text-sm py-8">Učitavanje...</p>
        ) : offers.length === 0 ? (
          <div className="text-center py-8">
            <Tag className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Još nemate aktivnih ponuda</p>
          </div>
        ) : (
          <div className="space-y-3">
            {offers.map(offer => (
              <div key={offer.id} className={`p-4 rounded-2xl bg-card border transition-colors ${offer.active ? 'border-primary/30' : 'border-border opacity-60'}`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm">{offer.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{offer.business_id}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => handleToggle(offer)}
                      className={`text-[10px] px-2 py-1 rounded-full border font-medium ${offer.active ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-secondary text-muted-foreground border-border'}`}>
                      {offer.active ? 'Aktivno' : 'Neaktivno'}
                    </button>
                    <button onClick={() => handleDelete(offer.id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {offer.description && <p className="text-xs text-muted-foreground mb-2">{offer.description}</p>}
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {offer.valid_from} → {offer.valid_to}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
