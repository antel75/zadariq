import { useNavigate } from 'react-router-dom';
import { Sunrise, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export function DanasBanner() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const lang = language === 'hr' ? 'hr' : 'en';

  return (
    <button
      onClick={() => navigate('/danas')}
      className="w-full flex items-center gap-3 rounded-2xl border border-accent/25 bg-accent/10 px-4 py-3 text-left hover:bg-accent/15 transition-colors"
    >
      <Sunrise className="h-5 w-5 text-accent shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">
          {lang === 'hr' ? 'Zadar danas' : 'Zadar today'}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {lang === 'hr'
            ? 'Vrijeme, dežurna ljekarna, događanja — sve u 30 sekundi'
            : 'Weather, duty pharmacy, events — all in 30 seconds'}
        </p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
    </button>
  );
}
