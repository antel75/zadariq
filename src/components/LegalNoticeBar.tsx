import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const STORAGE_KEY = 'zadariq-legal-dismissed';

const texts = {
  hr: 'ZadarIQ je informativni gradski agregator. Podaci dolaze iz javnih izvora i zajednice te mogu kasniti ili odstupati. Za službene i pravno važeće informacije provjerite izvorni servis.',
  en: 'ZadarIQ is an informational city aggregator. Data comes from public sources and the community and may be delayed or inaccurate. For official and legally binding information, please check the original service.',
  de: 'ZadarIQ ist ein informativer Stadtaggregator. Daten stammen aus öffentlichen Quellen und der Community und können verzögert oder ungenau sein. Für offizielle und rechtlich verbindliche Informationen prüfen Sie bitte den Originaldienst.',
  it: 'ZadarIQ è un aggregatore informativo cittadino. I dati provengono da fonti pubbliche e dalla comunità e potrebbero essere in ritardo o imprecisi. Per informazioni ufficiali e legalmente vincolanti, consultare il servizio originale.',
};

export function LegalNoticeBar() {
  const { language } = useLanguage();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(STORAGE_KEY) === '1');
  }, []);

  if (dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setDismissed(true);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur border-t border-border px-4 py-3">
      <div className="max-w-lg mx-auto flex items-start gap-3">
        <p className="text-[11px] text-muted-foreground leading-relaxed flex-1">
          {texts[language]}
        </p>
        <button
          onClick={handleDismiss}
          className="p-1 rounded-full hover:bg-muted transition-colors flex-shrink-0 mt-0.5"
          aria-label="Close"
        >
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
