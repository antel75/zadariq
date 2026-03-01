import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSelector } from '@/components/LanguageSelector';
import { ArrowLeft, Building2, Mail, Lock, User, Phone, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type Step = 'landing' | 'register' | 'otp' | 'success';

export default function Join() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [step, setStep] = useState<Step>('landing');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tosAccepted, setTosAccepted] = useState(false);
  const [otp, setOtp] = useState('');
  const [form, setForm] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tosAccepted) { setError('Morate prihvatiti uvjete korištenja'); return; }
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { 
            full_name: form.full_name, 
            phone: form.phone,
            tos_accepted_at: new Date().toISOString(),
          },
          emailRedirectTo: 'https://zadariq.city/email-confirmed'
        }
      });
      if (error) throw error;

      await supabase.functions.invoke('send-email', {
        body: {
          to: form.email,
          subject: 'ZadarIQ — Potvrdite vašu email adresu',
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#0f0f1a;color:#ffffff">
              <div style="text-align:center;margin-bottom:32px">
                <h1 style="color:#ffffff;font-size:24px;margin:0">ZadarIQ</h1>
                <p style="color:#888;font-size:14px;margin:4px 0">Pametni gradski asistent</p>
              </div>
              <div style="background:#1a1a2e;border-radius:16px;padding:32px;margin-bottom:24px">
                <h2 style="color:#ffffff;font-size:20px;margin:0 0 16px">Dobrodošli, ${form.full_name}! 👋</h2>
                <p style="color:#aaa;line-height:1.6">Hvala što ste se pridružili ZadarIQ zajednici. Da biste aktivirali profil, molimo potvrdite vašu email adresu klikom na link u emailu koji ste primili od nas.</p>
              </div>
              <div style="background:#1a2a1a;border-radius:12px;padding:20px;margin-bottom:24px;border:1px solid #2a4a2a">
                <p style="color:#4ade80;font-size:13px;margin:0">✓ Registracija uspješna</p>
                <p style="color:#4ade80;font-size:13px;margin:4px 0">✓ Uvjeti korištenja prihvaćeni</p>
                <p style="color:#888;font-size:13px;margin:4px 0">⏳ Email potvrda — na čekanju</p>
              </div>
              <p style="color:#555;font-size:12px;text-align:center">ZadarIQ · zadariq.city · noreply@zadariq.city</p>
            </div>
          `
        }
      });

      // Save to owner_profiles
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('owner_profiles').upsert({
          user_id: user.id,
          email: form.email,
          full_name: form.full_name,
          phone: form.phone,
        });
      }

      setStep('success');
    } catch (err: any) {
      setError(err.message || 'Greška pri registraciji');
    }
    setLoading(false);
  };

  // LANDING
  if (step === 'landing') return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-secondary">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <LanguageSelector />
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🏙️</div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Pridruži se ZadarIQ</h1>
          <p className="text-muted-foreground">Postavi svoj objekt na kartu Zadra i dopri do tisuća posjetitelja</p>
        </div>

        <div className="space-y-3 mb-8">
          <h3 className="font-semibold text-foreground text-sm">Razine pouzdanosti</h3>

          <div className="p-4 rounded-2xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">⭐</span>
              <span className="font-bold text-foreground text-sm">Registrirani</span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">Popunili ste profil i potvrdili email adresu.</p>
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p>✓ Profil vidljiv korisnicima</p>
              <p>✓ Možete uređivati podatke i radno vrijeme</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-primary/30">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">⭐⭐</span>
              <span className="font-bold text-foreground text-sm">Verificirani</span>
              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full ml-auto">Preporučeno</span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">OIB vašeg obrta/firme provjeren je u javnom registru.</p>
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p>✓ Sve od ⭐</p>
              <p>✓ Zelena kvačica uz naziv objekta</p>
              <p>✓ Viši rang u pretrazi</p>
              <p>✓ Tjedna ponuda na homepageu</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-yellow-500/30">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">⭐⭐⭐</span>
              <span className="font-bold text-foreground text-sm">Pouzdani partner</span>
              <span className="text-[10px] bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded-full ml-auto">Elite</span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">Dokumenti + ručna admin provjera. Nema nikakve sumnje.</p>
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p>✓ Sve od ⭐⭐</p>
              <p>✓ Zlatna značka na profilu</p>
              <p>✓ Featured pozicija na homepageu</p>
              <p>✓ Statistike pregleda profila</p>
              <p>✓ Priority podrška</p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 mb-8">
          <h3 className="font-semibold text-foreground mb-3 text-sm">Što dobivate?</h3>
          <div className="space-y-1.5 text-xs text-muted-foreground">
            <p>✓ Profil vidljiv svim korisnicima ZadarIQ</p>
            <p>✓ Sami uređujete podatke i radno vrijeme</p>
            <p>✓ GPS pozicija na Radar karti</p>
            <p>✓ Tjedna ponuda na homepageu aplikacije</p>
            <p>✓ Statistike pregleda profila</p>
            <p>✓ Potpuno besplatno</p>
          </div>
        </div>

        <button
          onClick={() => setStep('register')}
          className="w-full py-4 rounded-2xl bg-primary text-white font-bold text-lg hover:bg-primary/90 transition-colors"
        >
          Dodaj svoj objekt →
        </button>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Već imate profil?{' '}
          <button onClick={() => navigate('/owner/login')} className="text-primary underline">
            Prijavi se
          </button>
        </p>
      </div>
    </div>
  );

  // REGISTER
  if (step === 'register') return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => setStep('landing')} className="p-1.5 rounded-lg hover:bg-secondary">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="text-center">
            <h1 className="font-bold text-sm">Kreirajte račun</h1>
            <p className="text-[10px] text-muted-foreground">Korak 1 od 2</p>
          </div>
          <LanguageSelector />
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="text-center mb-6">
          <Building2 className="h-10 w-10 text-primary mx-auto mb-3" />
          <h2 className="text-xl font-bold text-foreground">Vaši podaci</h2>
          <p className="text-xs text-muted-foreground mt-1">Ovi podaci su privatni i vidljivi samo vama i adminu</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Ime i prezime *</label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input type="text" required value={form.full_name}
                onChange={e => setForm(f => ({...f, full_name: e.target.value}))}
                placeholder="Ime Prezime"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:border-primary" />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Email adresa *</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input type="email" required value={form.email}
                onChange={e => setForm(f => ({...f, email: e.target.value}))}
                placeholder="email@primjer.hr"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:border-primary" />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Telefon</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input type="tel" value={form.phone}
                onChange={e => setForm(f => ({...f, phone: e.target.value}))}
                placeholder="+385 9X XXX XXXX"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:border-primary" />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Lozinka * (min. 8 znakova)</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input type="password" required minLength={8} value={form.password}
                onChange={e => setForm(f => ({...f, password: e.target.value}))}
                placeholder="Minimum 8 znakova"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:border-primary" />
            </div>
          </div>

          {/* ToS Checkbox */}
          <div className="p-4 rounded-xl bg-secondary border border-border">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={tosAccepted}
                onChange={e => setTosAccepted(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded accent-primary shrink-0" />
              <span className="text-xs text-muted-foreground leading-relaxed">
                Prihvaćam{' '}
                <button type="button" onClick={() => navigate('/terms')} className="text-primary underline">uvjete korištenja</button>
                {' '}i{' '}
                <button type="button" onClick={() => navigate('/privacy')} className="text-primary underline">politiku privatnosti</button>
                . Potvrđujem da sam ovlašteni predstavnik navedenog objekta i da su uneseni podaci točni.
                <span className="block mt-1 text-[10px] text-muted-foreground/60">
                  Lažno predstavljanje je kazneno djelo. ZadarIQ bilježi IP adrese i surađuje s nadležnim tijelima.
                </span>
              </span>
            </label>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading || !tosAccepted}
            className="w-full py-4 rounded-2xl bg-primary text-white font-bold hover:bg-primary/90 transition-colors disabled:opacity-40">
            {loading ? 'Kreiranje računa...' : 'Kreiraj račun →'}
          </button>
        </form>
      </div>
    </div>
  );

  // SUCCESS
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center">
        <div className="text-6xl mb-6">📧</div>
        <h2 className="text-xl font-bold text-foreground mb-3">Provjerite email!</h2>
        <p className="text-muted-foreground mb-2">Poslali smo potvrdu na:</p>
        <p className="font-semibold text-primary mb-6">{form.email}</p>
        <div className="p-4 rounded-2xl bg-card border border-border mb-6 text-left space-y-2">
          <p className="text-xs text-muted-foreground">✓ Kliknite link u emailu da potvrdite račun</p>
          <p className="text-xs text-muted-foreground">✓ Nakon potvrde prijavite se</p>
          <p className="text-xs text-muted-foreground">✓ Dodajte profil svog objekta</p>
        </div>
        <button onClick={() => navigate('/')}
          className="w-full py-4 rounded-2xl bg-primary text-white font-bold hover:bg-primary/90 transition-colors">
          Natrag na početnu →
        </button>
      </div>
    </div>
  );
}
