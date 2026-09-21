import { useNavigate } from 'react-router-dom';
import { MapPin, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const COPY: Record<string, { title: string; sub: string }> = {
  hr: { title: 'Radar Zadar', sub: 'Karta grada — što je sada otvoreno oko tebe' },
  en: { title: 'Zadar Radar', sub: 'City map — what is open around you right now' },
  de: { title: 'Zadar Radar', sub: 'Stadtkarte — was jetzt in deiner Nähe offen ist' },
  it: { title: 'Radar Zadar', sub: 'Mappa della città — cosa è aperto ora vicino a te' },
};

export function RadarBanner() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const copy = COPY[language] || COPY.hr;

  return (
    <button
      onClick={() => navigate('/radar')}
      className="w-full flex items-center gap-3 p-4 rounded-2xl bg-card border border-border hover:border-accent/50 transition-all active:scale-[0.99] text-left"
    >
      <span className="shrink-0 p-2.5 rounded-xl bg-primary/15">
        <MapPin className="h-5 w-5 text-primary" />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-bold text-foreground">{copy.title}</span>
        <span className="block text-xs text-muted-foreground truncate">{copy.sub}</span>
      </span>
      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
    </button>
  );
}
