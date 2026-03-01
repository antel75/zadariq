import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UserCheck, ShieldCheck, Loader2, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { checkSimilarity } from '@/utils/similarity';
import { businesses } from '@/data/mockData';

interface ClaimModalProps {
  businessId: string;
  businessName: string;
  businessAddress?: string;
  open: boolean;
  onClose: () => void;
}

export function ClaimModal({ businessId, businessName, businessAddress, open, onClose }: ClaimModalProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [sent, setSent] = useState(false);
  const [tosAccepted, setTosAccepted] = useState(false);
  const [error, setError] = useState('');

  const handleClaim = async () => {
    if (!tosAccepted) { setError('Morate prihvatiti uvjete korištenja'); return; }
    setLoading(true);
    setError('');

    try {
      // Similarity check
      const candidates = businesses.map(b => ({ id: b.id, name: b.name, address: b.address }));
      const similar = checkSimilarity(businessName, businessAddress || '', candidates);
      if (similar && similar.match.id !== businessId) {
        await supabase.functions.invoke('send-email', {
          body: {
            to: 'admin@zadariq.city',
            subject: `[ZadarIQ] ⚠️ Potencijalni duplikat — ${businessName}`,
            html: `<div style="font-family:sans-serif;padding:24px;background:#0f0f1a;color:#fff">
              <h2 style="color:#f59e0b">⚠️ Upozorenje: Potencijalni duplikat</h2>
              <p><b>Novi profil:</b> ${businessName} — ${businessAddress}</p>
              <p><b>Sličan postojećem:</b> ${similar.match.name} — ${similar.match.address}</p>
              <p><b>Podudaranje:</b> ${Math.round(similar.score * 100)}%</p>
              <p><b>Korisnik:</b> ${user!.email}</p>
              <p style="color:#f59e0b">Provjeri je li ovo legitimno preuzimanje ili hostile takeover!</p>
            </div>`
          }
        });
      }

      // Log the claim request
      await supabase.from('ownership_audit_log').insert({
        business_id: businessId,
        action: 'claim_requested',
        actor_user_id: user!.id,
        email: user!.email,
        details: { 
          business_name: businessName, 
          business_address: businessAddress,
          source: 'profile_button'
        }
      });

      // Insert pending claim
      const { error: claimError } = await supabase
        .from('ownership_claim_requests')
        .insert({
          business_id: businessId,
          email: user!.email,
          status: 'pending',
          requester_user_id: user!.id,
        });

      if (claimError && !claimError.message.includes('duplicate')) throw claimError;

      // Notify admin
      await supabase.functions.invoke('send-email', {
        body: {
          to: 'admin@zadariq.city',
          subject: `[ZadarIQ] Zahtjev za preuzimanje profila — ${businessName}`,
          html: `
            <div style="font-family:sans-serif;padding:24px;background:#0f0f1a;color:#fff">
              <h2 style="color:#fff">⚠️ Novi zahtjev za preuzimanje profila</h2>
              <table style="width:100%;border-collapse:collapse;margin-top:16px">
                <tr><td style="color:#888;padding:6px 0">Objekt:</td><td style="color:#fff;font-weight:bold">${businessName}</td></tr>
                <tr><td style="color:#888;padding:6px 0">Adresa:</td><td style="color:#fff">${businessAddress || '—'}</td></tr>
                <tr><td style="color:#888;padding:6px 0">Korisnik:</td><td style="color:#fff">${user!.email}</td></tr>
                <tr><td style="color:#888;padding:6px 0">Vrijeme:</td><td style="color:#fff">${new Date().toLocaleString('hr-HR')}</td></tr>
                <tr><td style="color:#888;padding:6px 0">ID objekta:</td><td style="color:#aaa;font-size:12px">${businessId}</td></tr>
              </table>
              <div style="margin-top:24px;padding:16px;background:#1a1a2e;border-radius:8px;border-left:4px solid #f59e0b">
                <p style="color:#f59e0b;font-size:13px;margin:0">⚠️ Provjeri sistem za duplikate i potvrdi autentičnost prije odobravanja.</p>
              </div>
            </div>
          `
        }
      });

      // Confirm to user
      await supabase.functions.invoke('send-email', {
        body: {
          to: user!.email,
          subject: 'ZadarIQ — Zahtjev za preuzimanje profila primljen',
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#0f0f1a;color:#fff">
              <h1 style="color:#fff;font-size:20px">ZadarIQ</h1>
              <div style="background:#1a1a2e;border-radius:16px;padding:24px;margin-top:16px">
                <h2 style="color:#fff;font-size:18px">Zahtjev primljen ✓</h2>
                <p style="color:#aaa">Vaš zahtjev za preuzimanje profila <strong style="color:#fff">${businessName}</strong> je zaprimljen.</p>
                <p style="color:#aaa">Admin će pregledati zahtjev i obavijestiti vas unutar 48 sati.</p>
              </div>
              <p style="color:#555;font-size:12px;margin-top:24px">ZadarIQ · zadariq.city</p>
            </div>
          `
        }
      });

      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Greška — pokušajte ponovno');
    }
    setLoading(false);
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => { setSent(false); setTosAccepted(false); setError(''); }, 200);
  };

  // Not logged in
  if (!user) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-accent" />
              Preuzimanje profila
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Za preuzimanje profila objekta potrebno je kreirati ZadarIQ račun.
            </p>
            <button onClick={() => { handleClose(); navigate('/join'); }}
              className="w-full py-3 rounded-xl bg-primary text-white font-medium text-sm hover:bg-primary/90">
              Kreiraj račun →
            </button>
            <button onClick={() => { handleClose(); navigate('/owner/login'); }}
              className="w-full py-3 rounded-xl bg-secondary border border-border text-foreground font-medium text-sm hover:bg-secondary/80">
              Već imam račun — prijavi se
            </button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Success
  if (sent) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <div className="py-8 text-center flex flex-col items-center gap-3">
            <ShieldCheck className="h-12 w-12 text-green-400" />
            <h3 className="text-lg font-bold text-foreground">Zahtjev poslan!</h3>
            <p className="text-sm text-muted-foreground text-center">
              Admin će pregledati vaš zahtjev i obavijestiti vas na <strong>{user.email}</strong> unutar 48 sati.
            </p>
            <button onClick={handleClose}
              className="mt-2 px-6 py-2.5 rounded-xl bg-primary text-white font-medium text-sm hover:bg-primary/90">
              Zatvori
            </button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Confirmation step
  if (!confirmed) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-accent" />
              Potvrda preuzimanja
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">Odabrali ste preuzimanje profila:</p>
            <div className="p-4 rounded-xl bg-secondary border border-border">
              <p className="font-bold text-foreground">{businessName}</p>
              {businessAddress && <p className="text-xs text-muted-foreground mt-1">{businessAddress}</p>}
            </div>
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <p className="text-sm font-medium text-amber-300 mb-1">⚠️ Važno!</p>
              <p className="text-xs text-amber-200 leading-relaxed">
                Preuzimanjem profila pod materijalnom i krivičnom odgovornošću potvrđujete da ste zakoniti vlasnik ili ovlašteni predstavnik navedenog objekta.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={handleClose}
                className="flex-1 py-3 rounded-xl bg-secondary border border-border text-foreground font-medium text-sm hover:bg-secondary/80">
                ✗ Nije točno
              </button>
              <button onClick={() => setConfirmed(true)}
                className="flex-1 py-3 rounded-xl bg-primary text-white font-medium text-sm hover:bg-primary/90">
                ✓ Da, to sam ja
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Main claim form
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-accent" />
            Preuzimanje profila
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="p-3 rounded-xl bg-secondary border border-border">
            <p className="text-sm font-medium text-foreground">{businessName}</p>
            {businessAddress && <p className="text-xs text-muted-foreground mt-0.5">{businessAddress}</p>}
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-300 leading-relaxed">
              Zahtjev će pregledati admin unutar 48h. Lažno predstavljanje je kazneno djelo prema čl. 294. KZ-a.
            </p>
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={tosAccepted}
              onChange={e => setTosAccepted(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded accent-primary shrink-0" />
            <span className="text-xs text-muted-foreground leading-relaxed">
              Potvrđujem da sam ovlašteni predstavnik ovog objekta i prihvaćam{' '}
              <button type="button" onClick={() => navigate('/terms')} className="text-primary underline">
                uvjete korištenja
              </button>
              . ZadarIQ zadržava pravo ukinuti pristup u slučaju kršenja uvjeta.
            </span>
          </label>

          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}

          <button onClick={handleClaim} disabled={loading || !tosAccepted}
            className="w-full h-12 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Slanje zahtjeva...' : 'Pošalji zahtjev za preuzimanje'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
