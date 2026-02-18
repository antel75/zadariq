import { useNavigate } from 'react-router-dom';
import { Zap, CheckCircle2, Clock, XCircle, ChevronRight } from 'lucide-react';
import { useEvChargers, getChargerStatusLabel } from '@/hooks/useEvChargers';

export function EvChargerWidget() {
  const navigate = useNavigate();
  const { data: chargers } = useEvChargers();

  if (!chargers || chargers.length === 0) return null;

  const available = chargers.filter(c => c.status === 'available').length;
  const busy = chargers.filter(c => c.status === 'busy').length;
  const broken = chargers.filter(c => c.status === 'broken').length;
  const unknown = chargers.filter(c => c.status === 'unknown').length;
  const total = chargers.length;

  // Summary text
  let summaryText: string;
  let summaryColor: string;
  if (available > 0) {
    summaryText = `${available} slobodn${available === 1 ? 'o' : 'ih'} punjač${available === 1 ? '' : 'a'}`;
    summaryColor = 'text-status-open';
  } else if (unknown === total) {
    summaryText = 'Nema podataka uživo';
    summaryColor = 'text-muted-foreground';
  } else {
    summaryText = 'Svi zauzeti ili ne rade';
    summaryColor = 'text-destructive';
  }

  return (
    <button
      onClick={() => navigate('/ev-chargers')}
      className="w-full p-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors text-left"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Punjenje auta ⚡</h3>
            <p className={`text-xs font-medium ${summaryColor}`}>{summaryText}</p>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Mini status bar */}
      <div className="flex gap-3 mt-2 text-[10px] text-muted-foreground">
        {available > 0 && (
          <span className="flex items-center gap-0.5 text-status-open">
            <CheckCircle2 className="h-2.5 w-2.5" /> {available}
          </span>
        )}
        {busy > 0 && (
          <span className="flex items-center gap-0.5 text-status-warning">
            <Clock className="h-2.5 w-2.5" /> {busy}
          </span>
        )}
        {broken > 0 && (
          <span className="flex items-center gap-0.5 text-destructive">
            <XCircle className="h-2.5 w-2.5" /> {broken}
          </span>
        )}
        <span>{total} ukupno</span>
      </div>
    </button>
  );
}
