import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LanguageSelector } from '@/components/LanguageSelector';
import { ArrowLeft, Search, Building2, ChevronRight, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { businesses } from '@/data/mockData';

export default function OwnerClaim() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [claimed, setClaimed] = useState<string | null>(null);

  const search = async () => {
    if (query.length < 2) return;
    setLoading(true);
    const q = query.toLowerCase();
    const found = businesses.filter(b => 
      b.name.toLowerCase().includes(q) || 
      b.address.toLowerCase().includes(q)
    ).slice(0, 15);
    setResults(found);
    setLoading(false);
  };

  const handleClaim = async (business: any) => {
    setClaiming(business.id);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate('/owner/login'); return; }

    // Check if already claimed
    const { data: existing } = await supabase
      .from('business_ownership')
      .select('id')
      .eq('business_id', business.id)
      .single();

    if (existing) {
      alert('Ovaj objekt je već preuzet. Kontaktirajte nas ako smatrate da je to greška.');
      setClaiming(null);
      return;
    }

    const { error } = await supabase
      .from('business_ownership')
      .insert({
        business_id: business.id,
        owner_user_id: user.id,
        verified: false,
        verification_level: 1,
      });

    if (!error) {
      // Log action
      await supabase.from('ownership_audit_log').insert({
        business_id: business.id,
        action: 'claim_requested',
        actor_user_id: user.id,
        email: user.email,
        details: { business_name: business.name, address: business.address }
      });

      // Notify admin
      await supabase.functions.invoke('send-email', {
        body: {
          to: 'admin@zadariq.city',
          subject: `[ZadarIQ] Novi zahtjev za preuzimanje profila`,
          html: `
            <div style="font-family:sans-serif;padding:24px">
              <h2>Novi zahtjev za preuzimanje</h2>
              <p><b>Objekt:</b> ${business.name}</p>
              <p><b>Adresa:</b> ${business.address}</p>
              <p><b>Korisnik:</b> ${user.email}</p>
              <p><b>Vrijeme:</b> ${new Date().toLocaleString('hr-HR')}</p>
              <p>Pregledajte u admin panelu.</p>
            </div>
          `
        }
      });

      setClaimed(business.id);
    }
    setClaiming(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate('/owner/dashboard')} className="p-1.5 rounded-lg hover:bg-secondary">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="text-center">
            <h1 className="font-bold text-sm">Preuzmi profil objekta</h1>
            <p className="text-[10px] text-muted-foreground">Pronađi svoj objekt u bazi</p>
          </div>
          <LanguageSelector />
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 mb-6">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Pretražite bazu ZadarIQ objekata. Ako pronađete svoj objekt, možete zatražiti preuzimanje profila. 
            Admin će pregledati zahtjev i odobriti ga unutar 48h.
          </p>
        </div>

        {/* Search */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search()}
              placeholder="Naziv objekta..."
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <button onClick={search} disabled={loading}
            className="px-4 py-3 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
            {loading ? '...' : 'Traži'}
          </button>
        </div>

        {/* Results */}
        <div className="space-y-2">
          {results.map(biz => (
            <div key={biz.id} className="p-4 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm truncate">{biz.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{biz.address}</p>
                  <span className="text-[10px] bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">{biz.category}</span>
                </div>
                {claimed === biz.id ? (
                  <div className="shrink-0 flex items-center gap-1 text-green-400 text-xs">
                    <CheckCircle className="h-4 w-4" />
                    Zatraženo
                  </div>
                ) : (
                  <button
                    onClick={() => handleClaim(biz)}
                    disabled={claiming === biz.id}
                    className="shrink-0 px-3 py-2 rounded-xl bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors disabled:opacity-50"
                  >
                    {claiming === biz.id ? '...' : 'Preuzmi'}
                  </button>
                )}
              </div>
            </div>
          ))}

          {results.length === 0 && query.length >= 2 && !loading && (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm mb-2">Objekt nije pronađen u bazi</p>
              <button onClick={() => navigate('/owner/create')}
                className="text-primary text-sm underline">
                Dodajte novi objekt →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
