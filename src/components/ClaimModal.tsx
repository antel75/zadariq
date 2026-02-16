import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UserCheck, ShieldCheck, Loader2 } from 'lucide-react';

interface ClaimModalProps {
  businessId: string;
  businessName: string;
  open: boolean;
  onClose: () => void;
}

type Step = 'email' | 'code' | 'success';

export function ClaimModal({ businessId, businessName, open, onClose }: ClaimModalProps) {
  const { t } = useLanguage();
  const { user, session } = useAuth();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<Step>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !session) return;

    setLoading(true);
    setError('');

    try {
      const { data, error: fnError } = await supabase.functions.invoke('send-ownership-code', {
        body: { business_id: businessId, email: email.trim() },
      });

      if (fnError) throw fnError;
      // Always move to code step (anti-enumeration)
      setStep('code');
    } catch {
      setError(t('claim.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !session) return;

    setLoading(true);
    setError('');

    try {
      const { data, error: fnError } = await supabase.functions.invoke('verify-ownership-code', {
        body: { business_id: businessId, email: email.trim(), code: code.trim() },
      });

      if (fnError) throw fnError;

      if (data?.success) {
        setStep('success');
      } else {
        const errKey = data?.error;
        if (errKey === 'expired') setError(t('claim.expired'));
        else if (errKey === 'locked') setError(t('claim.locked'));
        else setError(t('claim.error'));
      }
    } catch {
      setError(t('claim.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setStep('email');
      setEmail('');
      setCode('');
      setError('');
    }, 200);
  };

  if (!user) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-accent" />
              {t('claim.title')}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-4">{t('claim.loginRequired')}</p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-accent" />
            {t('claim.title')}
          </DialogTitle>
        </DialogHeader>

        {step === 'email' && (
          <form onSubmit={handleSendCode} className="flex flex-col gap-4 py-2">
            <p className="text-sm text-muted-foreground">{businessName}</p>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('claim.email')}
              className="h-12 px-4 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="h-12 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? t('claim.sending') : t('claim.submit')}
            </button>
          </form>
        )}

        {step === 'code' && (
          <form onSubmit={handleVerify} className="flex flex-col gap-4 py-2">
            <p className="text-sm text-muted-foreground">{t('claim.codeSent')}</p>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={t('claim.code')}
              maxLength={6}
              className="h-12 px-4 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent text-center text-lg tracking-widest font-mono"
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="h-12 rounded-xl bg-accent text-accent-foreground font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? t('claim.verifying') : t('claim.verify')}
            </button>
          </form>
        )}

        {step === 'success' && (
          <div className="py-8 text-center flex flex-col items-center gap-3">
            <ShieldCheck className="h-10 w-10 text-status-open" />
            <p className="text-base font-medium text-foreground">{t('claim.success')}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
