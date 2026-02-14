import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Ship, Bus, ArrowRight, Anchor, Loader2 } from 'lucide-react';
import { useNextFerry, useNextBusDeparture, getTimeRemaining, formatTime } from '@/hooks/useTransportSchedules';

export function TransportWidget() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { nextFerry, isLoading: ferryLoading } = useNextFerry();
  const { nextBuses, isLoading: busLoading } = useNextBusDeparture();

  const nextBus = nextBuses.length > 0 ? nextBuses[0] : null;
  const isLoading = ferryLoading || busLoading;

  return (
    <button
      onClick={() => navigate('/transport')}
      className="w-full p-3 rounded-xl bg-card border border-border hover:border-accent/40 transition-colors text-left"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-foreground">{t('transport.widget')}</h3>
        <ArrowRight className="h-3 w-3 text-muted-foreground" />
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-1">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground">Učitavanje...</span>
        </div>
      ) : (
        <div className="space-y-1.5">
          {nextFerry && (
            <div className="flex items-center gap-2">
              {nextFerry.type === 'catamaran' ? (
                <Anchor className="h-3.5 w-3.5 text-accent shrink-0" />
              ) : (
                <Ship className="h-3.5 w-3.5 text-accent shrink-0" />
              )}
              <span className="text-[11px] text-foreground truncate">
                {nextFerry.destination || nextFerry.route} · {nextFerry.port_or_station} — <span className="font-semibold text-accent">{formatTime(nextFerry.departure_time)} ({getTimeRemaining(nextFerry.departure_time)})</span>
              </span>
            </div>
          )}
          {nextBus && (
            <div className="flex items-center gap-2">
              <Bus className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="text-[11px] text-foreground truncate">
                {nextBus.line_name} — <span className="font-semibold text-primary">{formatTime(nextBus.departure_time)} ({getTimeRemaining(nextBus.departure_time)})</span>
              </span>
            </div>
          )}
          {!nextFerry && !nextBus && (
            <span className="text-[11px] text-muted-foreground">Nema nadolazećih polazaka</span>
          )}
        </div>
      )}
    </button>
  );
}
