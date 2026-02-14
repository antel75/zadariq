import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { MapPin, Check, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { businesses, isBusinessOpen } from '@/data/mockData';
import { Business } from '@/data/types';

export function FieldReportButton() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [confirmed, setConfirmed] = useState<string | null>(null);

  // Simulate nearby businesses (first 5 open ones)
  const nearby = businesses.filter(b => isBusinessOpen(b)).slice(0, 5);

  const handleConfirm = (businessId: string, status: 'open' | 'closed') => {
    setConfirmed(businessId);
    setTimeout(() => {
      setConfirmed(null);
      setOpen(false);
    }, 1500);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-2xl bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all active:scale-95"
      >
        <MapPin className="h-4 w-4" />
        <span className="text-sm font-semibold">{t('field.iAmHere')}</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-accent" />
              {t('field.title')}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-2 py-2">
            <p className="text-xs text-muted-foreground mb-2">{t('field.subtitle')}</p>
            {nearby.map((b) => (
              <div key={b.id} className="flex items-center justify-between p-3 rounded-xl border border-border">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{b.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{b.address}</p>
                </div>
                {confirmed === b.id ? (
                  <span className="text-xs font-medium text-status-open">{t('field.thanks')}</span>
                ) : (
                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={() => handleConfirm(b.id, 'open')}
                      className="p-2 rounded-lg bg-status-open/10 text-status-open hover:bg-status-open/20 transition-colors"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleConfirm(b.id, 'closed')}
                      className="p-2 rounded-lg bg-status-closed/10 text-status-closed hover:bg-status-closed/20 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
