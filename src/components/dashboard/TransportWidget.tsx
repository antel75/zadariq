import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Ship, Bus, ArrowRight, Timer } from 'lucide-react';
import { getNextFerry, getTimeRemaining, cityBusLines, getNextBusDepartures } from '@/data/transportData';

export function TransportWidget() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const nextFerry = getNextFerry();
  const nextBus4 = getNextBusDepartures('b4', 1);

  return (
    <button
      onClick={() => navigate('/transport')}
      className="w-full p-3 rounded-xl bg-card border border-border hover:border-accent/40 transition-colors text-left"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-foreground">{t('transport.widget')}</h3>
        <ArrowRight className="h-3 w-3 text-muted-foreground" />
      </div>
      <div className="space-y-1.5">
        {nextFerry && (
          <div className="flex items-center gap-2">
            <Ship className="h-3.5 w-3.5 text-accent shrink-0" />
            <span className="text-[11px] text-foreground truncate">
              {nextFerry.destination} — <span className="font-semibold text-accent">{getTimeRemaining(nextFerry.departureTime)}</span>
            </span>
          </div>
        )}
        {nextBus4.length > 0 && (
          <div className="flex items-center gap-2">
            <Bus className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-[11px] text-foreground truncate">
              {t('transport.line')} 4 — <span className="font-semibold text-primary">{getTimeRemaining(nextBus4[0])}</span>
            </span>
          </div>
        )}
      </div>
    </button>
  );
}
