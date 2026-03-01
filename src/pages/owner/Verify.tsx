import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LanguageSelector } from '@/components/LanguageSelector';
import { ArrowLeft, Upload, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function OwnerVerify() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(null);
  const [oib, setOib] = useState('');
  const [error, setError] = useState('');

  const handleOIB = async () => {
    if (oib.length !== 11) { setError('OIB mora imati točno 11 znamenki'); return; }
    setLoading(true);
    setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/owner/login'); return; }
      await supabase.functions.invoke('send-email', {
        body: {
          to: 'admin@zadariq.city',
          subject: '[ZadarIQ] Zahtjev za OIB verifikaciju',
          html: `<div style="font-family:sans-serif;padding:24px"><h2>OIB verifikacija</h2><p><b>Korisnik:</b> ${user.email}</p><p><b>OIB:</b> ${oib}</p></div>`
        }
      });
      await supabase.from('owner_profiles').update({ oib }).eq('user_id', user.id);
      setSent('oib');
    } catch (err) {
      setError(err.message || 'Greška');
    }
    setLoading(false);
  };

  const handleDoc = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/owner/login'); return; }
      await supabase.functions.invoke('send-email', {
        body: {
          to: 'admin@zadariq.city',
          subject: '[ZadarIQ] Zahtjev za dokument verifikaciju',
          html: `<div style="font-family:sans-serif;padding:24px"><h2>Verifikacija dokumentima</h2><p><b>Korisnik:</b> ${user.email}</p></div>`
        }
      });
      setSent('doc');
    } catch (err) {
      setError(err.message || 'Greška');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate('/owner/dashboard')} className="p-1.5 rounded-lg hover:bg-secondary">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="text-center">
            <h1 className="font-bold text-sm">Povećaj verifikaciju</h1>
            <p className="text-[10px] text-muted-foreground">Izgradite povjerenje korisnika</p>
          </div>
          <LanguageSelector />
        </div>
      </header>
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="p-5 rounded-2xl bg-card border border-primary/30">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">⭐⭐</span>
            <div>
              <p className="font-bold text-foreground text-sm">Verificirani</p>
              <p className="text-[10px] text-muted-foreground">OIB provjera u javnom registru</p>
            </div>
            <span className="ml-auto text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">Preporučeno</span>
          </div>
          <div className="space-y-1.5 text-xs text-muted-foreground mb-4">
            <p>✓ Zelena kvačica uz naziv objekta</p>
            <p>✓ Viši rang u pretrazi</p>
            <p>✓ Tjedna ponuda na homepageu</p>
          </div>
          {sent === 'oib' ? (
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <CheckCircle className="h-4 w-4" />
              Zahtjev poslan — admin će provjeriti OIB i obavijestiti vas
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">OIB obrta ili firme (11 znamenki)</label>
                <input type="text" value={oib}
                  onChange={e => setOib(e.target.value.replace(/\D/g, '').slice(0, 11))}
                  placeholder="12345678901" maxLength={11}
                  className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:border-primary font-mono tracking-wider" />
              </div>
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button onClick={handleOIB} disabled={loading || oib.length !== 11}
                className="w-full py-3 rounded-xl bg-primary text-white font-medium text-sm hover:bg-primary/90 disabled:opacity-40">
                {loading ? 'Slanje...' : 'Zatraži ⭐⭐ verifikaciju'}
              </button>
            </div>
          )}
        </div>
        <div className="p-5 rounded-2xl bg-card border border-yellow-500/30">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">⭐⭐⭐</span>
            <div>
              <p className="font-bold text-foreground text-sm">Pouzdani partner</p>
              <p className="text-[10px] text-muted-foreground">Dokumenti + ručna admin provjera</p>
            </div>
            <span className="ml-auto text-[10px] bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded-full">Elite</span>
          </div>
          <div className="space-y-1.5 text-xs text-muted-foreground mb-4">
            <p>✓ Sve od ⭐⭐</p>
            <p>✓ Zlatna značka na profilu</p>
            <p>✓ Featured pozicija na homepageu</p>
            <p>✓ Statistike pregleda profila</p>
            <p>✓ Priority podrška</p>
          </div>
          {sent === 'doc' ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <CheckCircle className="h-4 w-4" />
                Zahtjev poslan!
              </div>
              <p className="text-xs text-muted-foreground">
                Pošaljite dokumentaciju na <span className="text-primary">admin@zadariq.city</span> s naslovom "Verifikacija — naziv objekta"
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-secondary text-xs text-muted-foreground">
                <p>⏱ Obrada: 2-5 radnih dana</p>
                <p className="mt-1">Potrebno: obrtni list ili izvod iz sudskog/obrtnog registra</p>
              </div>
              <button onClick={handleDoc} disabled={loading}
                className="w-full py-3 rounded-xl bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 font-medium text-sm hover:bg-yellow-500/20 disabled:opacity-40 flex items-center justify-center gap-2">
                <Upload className="h-4 w-4" />
                Zatraži ⭐⭐⭐ verifikaciju
              </button>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground text-center px-4 leading-relaxed">
          ZadarIQ zadržava pravo odbiti ili ukinuti verifikaciju u slučaju netočnih podataka, u skladu s uvjetima korištenja.
        </p>
      </div>
    </div>
  );
}
