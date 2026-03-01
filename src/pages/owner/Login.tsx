import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSelector } from '@/components/LanguageSelector';
import { ArrowLeft, Mail, Lock, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function OwnerLogin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ email: '', password: '' });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });
      if (error) throw error;
      navigate('/owner/dashboard');
    } catch (err: any) {
      setError(err.message === 'Invalid login credentials' 
        ? 'Pogrešan email ili lozinka' 
        : err.message || 'Greška pri prijavi');
    }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!form.email) { setError('Unesite email adresu'); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
      redirectTo: 'https://zadariq.city/owner/reset-password'
    });
    if (!error) alert('Link za reset lozinke poslan na ' + form.email);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="p-1.5 rounded-lg hover:bg-secondary">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-bold">Prijava</h1>
          <LanguageSelector />
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <Building2 className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground">Dobrodošli nazad</h2>
          <p className="text-sm text-muted-foreground mt-1">Prijavite se u vaš ZadarIQ račun</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Email adresa</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input type="email" required value={form.email}
                onChange={e => setForm(f => ({...f, email: e.target.value}))}
                placeholder="email@primjer.hr"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:border-primary" />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Lozinka</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input type="password" required value={form.password}
                onChange={e => setForm(f => ({...f, password: e.target.value}))}
                placeholder="Vaša lozinka"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:border-primary" />
            </div>
          </div>

          <div className="text-right">
            <button type="button" onClick={handleForgotPassword}
              className="text-xs text-primary hover:underline">
              Zaboravili ste lozinku?
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-4 rounded-2xl bg-primary text-white font-bold hover:bg-primary/90 transition-colors disabled:opacity-50">
            {loading ? 'Prijava...' : 'Prijavi se →'}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Nemate račun?{' '}
          <button onClick={() => navigate('/join')} className="text-primary underline">
            Registrirajte se
          </button>
        </p>
      </div>
    </div>
  );
}
