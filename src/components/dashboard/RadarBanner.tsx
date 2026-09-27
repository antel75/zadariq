import { useNavigate } from 'react-router-dom';
import { MapPin, ChevronRight, CalendarDays } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const COPY: Record<string, { title: string; sub: string }> = {
  hr: { title: 'Radar Zadar', sub: 'Pronađi otvorena mjesta i provjeri radno vrijeme' },
  en: { title: 'Zadar Radar', sub: 'Find open places and check their hours' },
  de: { title: 'Zadar Radar', sub: 'Offene Orte finden und Öffnungszeiten prüfen' },
  it: { title: 'Radar Zadar', sub: 'Trova i locali aperti e controlla gli orari' },
};

const SUNDAY_COPY: Record<string, string> = {
  hr: 'Otvoreno ovu nedjelju',
  en: 'Open this Sunday',
  de: 'Diesen Sonntag geöffnet',
  it: 'Aperto questa domenica',
};

export function RadarBanner({ showSundayLink = false }: { showSundayLink?: boolean }) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const copy = COPY[language] || COPY.hr;

  return (
    <div className="overflow-hidden rounded-2xl bg-card border border-border">
    <button
      onClick={() => navigate('/radar')}
      className="w-full flex items-center gap-3 p-4 hover:bg-accent/5 transition-all active:scale-[0.99] text-left"
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
    {showSundayLink && (
      <button
        onClick={() => navigate('/radar?layer=sunday')}
        className="w-full flex items-center gap-2 border-t border-border px-4 py-3 text-sm font-medium text-primary hover:bg-primary/5 transition-colors text-left"
      >
        <CalendarDays className="h-4 w-4 shrink-0" />
        <span className="flex-1">{SUNDAY_COPY[language] || SUNDAY_COPY.hr}</span>
        <ChevronRight className="h-4 w-4 shrink-0" />
      </button>
    )}
    </div>
  );
}
