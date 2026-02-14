import { useState } from 'react';
import { Business } from '@/data/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle } from 'lucide-react';

interface ReportModalProps {
  business: Business | null;
  open: boolean;
  onClose: () => void;
}

export function ReportModal({ business, open, onClose }: ReportModalProps) {
  const { t } = useLanguage();
  const [submitted, setSubmitted] = useState(false);

  const handleReport = (type: string) => {
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 2000);
  };

  if (!business) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-status-warning" />
            {t('report.title')}
          </DialogTitle>
        </DialogHeader>

        {submitted ? (
          <div className="py-6 text-center">
            <p className="text-base font-medium text-foreground">{t('report.thanks')}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 py-2">
            <p className="text-sm text-muted-foreground mb-2">{business.name}</p>
            {['closed', 'moved', 'wrongHours', 'phoneIncorrect'].map((type) => (
              <button
                key={type}
                onClick={() => handleReport(type)}
                className="w-full px-4 py-3 text-left rounded-xl border border-border hover:bg-muted transition-colors text-sm font-medium text-foreground"
              >
                {t(`report.${type}`)}
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
