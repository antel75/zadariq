import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PushOptInBanner() {
  const { language } = useLanguage();
  const { permission, isSubscribed, subscribe } = usePushNotifications();
  const [dismissed, setDismissed] = useState(false);

  const supportsNotifications =
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window;

  if (!supportsNotifications || isSubscribed || permission === 'denied' || dismissed) {
    return null;
  }

  const text =
    language === 'hr'
      ? '🔔 Primaj obavijesti o nedjeljnim dućanima i gradskim alertima'
      : '🔔 Get notified about Sunday shops and city alerts';

  const buttonText = language === 'hr' ? 'Uključi obavijesti' : 'Enable notifications';

  return (
    <div className="fixed bottom-16 left-0 right-0 z-40 px-4">
      <div className="max-w-lg mx-auto bg-card/95 backdrop-blur-md border border-border rounded-xl p-3 shadow-lg flex items-center gap-3">
        <Bell className="h-5 w-5 text-primary shrink-0" />
        <p className="text-xs text-foreground flex-1">{text}</p>
        <Button
          size="sm"
          variant="default"
          className="text-xs shrink-0"
          onClick={subscribe}
        >
          {buttonText}
        </Button>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded-md hover:bg-muted transition-colors shrink-0"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
