import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/Footer';

function getFingerprint(): string {
  const nav = navigator;
  const raw = [nav.userAgent, nav.language, screen.width + 'x' + screen.height, new Date().getTimezoneOffset(), nav.hardwareConcurrency || 0].join('|');
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'fp_' + Math.abs(hash).toString(36);
}

export default function AddCafe() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [smokingStatus, setSmokingStatus] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim() || submitting) return;

    setSubmitting(true);
    const fingerprint = getFingerprint();

    // Rate limit: max 2 per day per fingerprint
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { data: todaySubmissions } = await supabase
      .from('pending_places')
      .select('id')
      .eq('fingerprint_hash', fingerprint)
      .gte('created_at', todayStart.toISOString());

    if (todaySubmissions && todaySubmissions.length >= 2) {
      toast({ title: t('addCafe.limitReached'), variant: 'destructive' });
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from('pending_places').insert({
      proposed_name: name.trim(),
      proposed_address: address.trim(),
      phone: phone.trim() || null,
      website: website.trim() || null,
      category: 'cafes',
      proposed_smoking_status: smokingStatus || null,
      fingerprint_hash: fingerprint,
    });

    if (error) {
      toast({ title: t('addCafe.error'), variant: 'destructive' });
    } else {
      setSubmitted(true);
      toast({ title: t('addCafe.thankYou') });
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="text-base font-semibold text-foreground">{t('addCafe.title')}</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pb-8">
        {submitted ? (
          <div className="mt-12 text-center">
            <div className="text-4xl mb-4">✅</div>
            <h2 className="text-lg font-semibold text-foreground mb-2">{t('addCafe.thankYou')}</h2>
            <p className="text-sm text-muted-foreground mb-6">{t('addCafe.pendingReview')}</p>
            <Button onClick={() => navigate(-1)}>{t('action.back')}</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <Label className="text-xs">{t('addCafe.name')} *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder={t('addCafe.namePlaceholder')} required />
            </div>
            <div>
              <Label className="text-xs">{t('addCafe.address')} *</Label>
              <Input value={address} onChange={e => setAddress(e.target.value)} placeholder={t('addCafe.addressPlaceholder')} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">{t('addCafe.phone')}</Label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="023 xxx xxx" />
              </div>
              <div>
                <Label className="text-xs">{t('addCafe.website')}</Label>
                <Input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://..." />
              </div>
            </div>

            {/* Optional smoking status */}
            <div>
              <Label className="text-xs mb-2 block">{t('smoking.title')} ({t('addCafe.optional')})</Label>
              <div className="flex gap-2">
                {(['allowed', 'partial', 'not_allowed'] as const).map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setSmokingStatus(smokingStatus === val ? '' : val)}
                    className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors border ${
                      smokingStatus === val
                        ? val === 'allowed' ? 'bg-status-open/20 text-status-open border-status-open/30'
                        : val === 'partial' ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30'
                        : 'bg-destructive/20 text-destructive border-destructive/30'
                        : 'bg-muted text-muted-foreground border-border'
                    }`}
                  >
                    {val === 'allowed' ? '🟢' : val === 'partial' ? '🟡' : '🔴'} {t(`smoking.${val === 'not_allowed' ? 'notAllowed' : val}`)}
                  </button>
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={submitting || !name.trim() || !address.trim()}>
              <Plus className="h-4 w-4 mr-1" />
              {submitting ? '...' : t('addCafe.submit')}
            </Button>

            <div className="flex items-start gap-1.5 mt-4">
              <Info className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-[10px] text-muted-foreground leading-relaxed">{t('addCafe.disclaimer')}</p>
            </div>
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
}
