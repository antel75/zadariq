import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSelector } from '@/components/LanguageSelector';
import { LogOut, Plus, Search, Star, Building2, ChevronRight, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Footer } from '@/components/Footer';

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [ownedBusinesses, setOwnedBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { navigate('/owner/login'); return; }
      setUser(user);
      loadProfile(user.id, user.email || '', user.user_metadata);
    });
  }, []);

  const loadProfile = async (userId: string, email: string, metadata?: any) => {
    let { data: prof } = await supabase
      .from('owner_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Auto-create profile if it doesn't exist (e.g. first login after email confirmation)
    if (!prof) {
      const { data: newProf } = await supabase
        .from('owner_profiles')
        .upsert({
          user_id: userId,
          email: email,
          full_name: metadata?.full_name || null,
          phone: metadata?.phone || null,
        })
        .select()
        .single();
      prof = newProf;
    }
    setProfile(prof);

    const { data: businesses } = await supabase
      .from('business_ownership')
      .select('*')
      .eq('owner_user_id', userId);
    setOwnedBusinesses(businesses || []);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const getVerificationBadge = (level: number) => {
    return '⭐'.repeat(level || 1);
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-muted-foreground">Učitavanje...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-foreground">🏙️ ZadarIQ</h1>
            <p className="text-[10px] text-muted-foreground">Upravljanje profilom</p>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <button onClick={handleLogout} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Welcome */}
        <div className="p-4 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xl">👤</span>
            </div>
            <div>
              <p className="font-bold text-foreground">{profile?.full_name || user?.email}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
              {user?.email_confirmed_at && (
                <span className="text-[10px] text-green-400">✓ Email potvrđen</span>
              )}
            </div>
          </div>
        </div>

        {/* My businesses */}
        <div>
          <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Moji objekti ({ownedBusinesses.length})
          </h2>

          {ownedBusinesses.length === 0 ? (
            <div className="p-6 rounded-2xl bg-card border border-border text-center">
              <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">Još nemate dodanih objekata</p>
              <p className="text-xs text-muted-foreground mb-4">Pronađite vaš objekt u bazi ili dodajte novi</p>
              <div className="flex gap-2">
                <button onClick={() => navigate('/owner/claim')}
                  className="flex-1 py-3 rounded-xl bg-secondary border border-border text-sm font-medium text-foreground flex items-center justify-center gap-2 hover:bg-secondary/80">
                  <Search className="h-4 w-4" />
                  Preuzmi postojeći
                </button>
                <button onClick={() => navigate('/owner/create')}
                  className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-primary/90">
                  <Plus className="h-4 w-4" />
                  Dodaj novi
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {ownedBusinesses.map(biz => (
                <div key={biz.id} onClick={() => navigate(`/owner/edit/${biz.business_id}`)}
                  className="p-4 rounded-2xl bg-card border border-border flex items-center gap-3 cursor-pointer hover:border-primary/50 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{biz.business_id}</p>
                    <p className="text-xs text-muted-foreground">{getVerificationBadge(biz.verification_level)}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
              ))}
              <button onClick={() => navigate('/owner/claim')}
                className="w-full py-3 rounded-xl border border-dashed border-border text-sm text-muted-foreground flex items-center justify-center gap-2 hover:border-primary/50 hover:text-primary transition-colors">
                <Plus className="h-4 w-4" />
                Dodaj još jedan objekt
              </button>
            </div>
          )}
        </div>

        {/* Verification status */}
        <div className="p-4 rounded-2xl bg-card border border-border">
          <h3 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-400" />
            Status verifikacije
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">⭐ Email potvrđen</span>
              <span className={`text-xs ${user?.email_confirmed_at ? 'text-green-400' : 'text-muted-foreground'}`}>
                {user?.email_confirmed_at ? '✓ Dovršeno' : '⏳ Na čekanju'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">⭐⭐ OIB verificiran</span>
              <span className="text-xs text-muted-foreground">⏳ Nije zatraženo</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">⭐⭐⭐ Dokumenti</span>
              <span className="text-xs text-muted-foreground">⏳ Nije zatraženo</span>
            </div>
          </div>
          <button onClick={() => navigate('/owner/verify')}
            className="w-full mt-3 py-2.5 rounded-xl bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors">
            Povećaj razinu verifikacije →
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
