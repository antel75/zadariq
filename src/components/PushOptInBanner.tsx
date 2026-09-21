import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Bell, X, Sunrise, ShoppingBag, TriangleAlert, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const DISMISS_KEY = 'zadariq_push_optin_dismissed';

export function PushOptInBanner() {
  const { language } = useLanguage();
  const { permission, isSubscribed, subscribe } = usePushNotifications();
  const [dismissed, setDismissed] = useState(true);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === '1');
    } catch {
      setDismissed(false);
    }
  }, []);

  const supportsNotifications =
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window;

  if (!supportsNotifications || isSubscribed || permission === 'denied' || dismissed) {
    return null;
  }

  const hr = language === 'hr';

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
  };

  const handleEnable = async () => {
    setBusy(true);
    try {
      await subscribe();
      setDone(true);
      setTimeout(() => setOpen(false), 1400);
    } finally {
      setBusy(false);
    }
  };

  const benefits = [
    {
      icon: Sunrise,
      title: hr ? 'Jutarnji sažetak u 6:05' : 'Morning brief at 6:05',
      text: hr
        ? 'Vrijeme, dežurna ljekarna i događanja za taj dan.'
        : 'Weather, duty pharmacy and what happens today.',
    },
    {
      icon: ShoppingBag,
      title: hr ? 'Radne nedjelje' : 'Sunday shopping',
      text: hr
        ? 'Javimo koji dućani rade u nedjelju, prije nego kreneš.'
        : 'Which shops are open on Sunday, before you head out.',
    },
    {
      icon: TriangleAlert,
      title: hr ? 'Važna upozorenja' : 'Important alerts',
      text: hr
        ? 'Nestanak struje ili vode, nevrijeme, zatvorene ceste.'
        : 'Power or water outages, storms, road closures.',
    },
  ];

  return (
    <>
      <div className="fixed bottom-16 left-0 right-0 z-40 px-4">
        <div className="max-w-lg mx-auto bg-card/95 backdrop-blur-md border border-border rounded-xl p-3 shadow-lg flex items-center gap-3">
          <Bell className="h-5 w-5 text-primary shrink-0" />
          <p className="text-xs text-foreground flex-1">
            {hr
              ? 'Želiš svako jutro znati što se događa u Zadru?'
              : 'Want a daily heads-up about Zadar?'}
          </p>
          <Button size="sm" className="text-xs shrink-0" onClick={() => setOpen(true)}>
            {hr ? 'Saznaj više' : 'Learn more'}
          </Button>
          <button
            onClick={handleDismiss}
            className="p-1 rounded-md hover:bg-muted transition-colors shrink-0"
            aria-label={hr ? 'Zatvori' : 'Dismiss'}
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <div className="mx-auto mb-2 h-12 w-12 rounded-2xl bg-primary/15 flex items-center justify-center">
              <Bell className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-center text-base">
              {hr ? 'Uključi obavijesti' : 'Enable notifications'}
            </DialogTitle>
            <DialogDescription className="text-center text-xs">
              {hr
                ? 'Najviše jedna poruka dnevno. Bez reklama, bez osobnih podataka.'
                : 'At most one message a day. No ads, no personal data.'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-1">
            {benefits.map((b) => (
              <div key={b.title} className="flex gap-3">
                <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <b.icon className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">{b.title}</p>
                  <p className="text-[11px] text-muted-foreground leading-snug">{b.text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2 pt-1">
            <Button onClick={handleEnable} disabled={busy || done} className="w-full">
              {done ? (
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  {hr ? 'Obavijesti uključene' : 'Notifications on'}
                </span>
              ) : busy ? (
                hr ? 'Uključujem…' : 'Enabling…'
              ) : hr ? (
                'Dopusti obavijesti'
              ) : (
                'Allow notifications'
              )}
            </Button>
            <button
              onClick={() => {
                setOpen(false);
                handleDismiss();
              }}
              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              {hr ? 'Ne sada' : 'Not now'}
            </button>
          </div>

          <p className="text-[10px] text-muted-foreground text-center">
            {hr
              ? 'Možeš isključiti obavijesti u bilo kojem trenutku u postavkama preglednika.'
              : 'You can turn notifications off anytime in your browser settings.'}
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
