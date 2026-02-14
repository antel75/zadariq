import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UserCheck } from 'lucide-react';

interface ClaimModalProps {
  businessName: string;
  open: boolean;
  onClose: () => void;
}

export function ClaimModal({ businessName, open, onClose }: ClaimModalProps) {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <Dialog open={open} onOpenChange={() => { onClose(); setSubmitted(false); setEmail(''); }}>
      <DialogContent className="sm:max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-accent" />
            {t('claim.title')}
          </DialogTitle>
        </DialogHeader>

        {submitted ? (
          <div className="py-6 text-center">
            <p className="text-base font-medium text-foreground">{t('claim.success')}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
            <p className="text-sm text-muted-foreground">{businessName}</p>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('claim.email')}
              className="h-12 px-4 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <button
              type="submit"
              className="h-12 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
            >
              {t('claim.submit')}
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
