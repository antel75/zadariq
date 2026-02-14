import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Ship, Anchor, Bus, MapPin, Clock, ArrowLeft, Users,
  AlertTriangle, CheckCircle2, XCircle, Timer, Navigation, Loader2,
} from 'lucide-react';
import {
  useTransportSchedules,
  getBoardingStatus,
  getTimeRemaining,
  formatTime,
  type TransportSchedule,
  type BoardingStatus,
} from '@/hooks/useTransportSchedules';

const statusConfig: Record<BoardingStatus, { color: string; icon: typeof CheckCircle2; labelKey: string }> = {
  boarding: { color: 'text-[hsl(var(--status-open))]', icon: CheckCircle2, labelKey: 'transport.boarding' },
  scheduled: { color: 'text-muted-foreground', icon: Clock, labelKey: 'transport.scheduled' },
  delayed: { color: 'text-[hsl(var(--status-warning))]', icon: AlertTriangle, labelKey: 'transport.delayed' },
  closed: { color: 'text-[hsl(var(--status-closed))]', icon: XCircle, labelKey: 'transport.closed' },
};

function getDaysNote(days: number[] | null): string | null {
  if (!days) return null;
  const hasWeekdays = [1,2,3,4,5].every(d => days.includes(d));
  const hasSat = days.includes(6);
  const hasSun = days.includes(7);
  if (hasWeekdays && hasSat && hasSun) return null; // every day
  if (hasWeekdays && !hasSat && !hasSun) return 'Ne vozi subotom, nedjeljom i praznikom';
  if (hasWeekdays && hasSat && !hasSun) return 'Ne vozi nedjeljom i praznikom';
  if (hasSat && !hasSun && !hasWeekdays) return 'Samo subotom';
  if (hasSun && !hasSat && !hasWeekdays) return 'Samo nedjeljom';
  return null;
}

function ScheduleCard({ schedule, t, isNext }: { schedule: TransportSchedule; t: (k: string) => string; isNext: boolean }) {
  const status = getBoardingStatus(schedule.departure_time);
  const sc = statusConfig[status];
  const StatusIcon = sc.icon;
  const isCatamaran = schedule.type === 'catamaran';
  const daysNote = getDaysNote(schedule.days_of_week);

  return (
    <div className={`p-3 rounded-xl bg-card border ${isNext ? 'border-accent ring-1 ring-accent/30' : 'border-border'} flex flex-col gap-1.5`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`p-2 rounded-lg ${isCatamaran ? 'bg-accent/10 text-accent' : 'bg-primary/10 text-primary'}`}>
            {isCatamaran ? <Anchor className="h-4 w-4" /> : <Ship className="h-4 w-4" />}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{schedule.destination || schedule.route}</p>
            <p className="text-[11px] text-muted-foreground">{schedule.port_or_station} · {schedule.carrier} · {schedule.line_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-sm font-bold text-foreground">{formatTime(schedule.departure_time)}</p>
            {status !== 'closed' && (
              <p className="text-[11px] text-accent font-medium">{getTimeRemaining(schedule.departure_time)}</p>
            )}
          </div>
          <div className={`flex items-center gap-1 ${sc.color}`}>
            <StatusIcon className="h-3.5 w-3.5" />
            <span className="text-[10px] font-medium">{t(sc.labelKey)}</span>
          </div>
        </div>
      </div>
      {daysNote && (
        <p className="text-[10px] text-muted-foreground italic ml-11">⚠ {daysNote}</p>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      <span className="ml-2 text-sm text-muted-foreground">Učitavanje rasporeda...</span>
    </div>
  );
}

export default function Transport() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [intercitySearch, setIntercitySearch] = useState('');
  const [selectedBusLine, setSelectedBusLine] = useState<string | null>(null);

  const { data: allSchedules, isLoading } = useTransportSchedules();

  const ferries = useMemo(() => 
    (allSchedules || []).filter(s => s.type === 'ferry'), 
    [allSchedules]
  );
  
  const catamarans = useMemo(() => 
    (allSchedules || []).filter(s => s.type === 'catamaran'), 
    [allSchedules]
  );

  const cityBuses = useMemo(() => 
    (allSchedules || []).filter(s => s.type === 'city_bus'), 
    [allSchedules]
  );

  const intercityBuses = useMemo(() => {
    const buses = (allSchedules || []).filter(s => s.type === 'intercity_bus');
    if (!intercitySearch.trim()) return buses;
    const q = intercitySearch.toLowerCase();
    return buses.filter(s => 
      (s.destination || '').toLowerCase().includes(q) || 
      (s.route || '').toLowerCase().includes(q) ||
      (s.carrier || '').toLowerCase().includes(q)
    );
  }, [allSchedules, intercitySearch]);

  // Get unique bus line names
  const busLineNames = useMemo(() => {
    const names = [...new Set(cityBuses.map(b => b.line_name))];
    return names.sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.replace(/\D/g, '')) || 0;
      return numA - numB;
    });
  }, [cityBuses]);

  // Auto-select first bus line
  const activeBusLine = selectedBusLine || busLineNames[0] || null;

  const filteredBuses = useMemo(() => {
    if (!activeBusLine) return [];
    return cityBuses.filter(b => b.line_name === activeBusLine);
  }, [cityBuses, activeBusLine]);

  // Find the index of the next upcoming departure
  const nextBusIdx = useMemo(() => {
    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();
    return filteredBuses.findIndex(b => {
      const [h, m] = b.departure_time.split(':').map(Number);
      return h * 60 + m > nowMins;
    });
  }, [filteredBuses]);

  const selectedBusRoute = cityBuses.find(b => b.line_name === activeBusLine)?.route || '';

  // Find next upcoming for highlighting
  const nextFerryIdx = ferries.findIndex(d => getBoardingStatus(d.departure_time) !== 'closed');
  const nextCatIdx = catamarans.findIndex(d => getBoardingStatus(d.departure_time) !== 'closed');

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-2 rounded-xl hover:bg-secondary transition-colors">
            <ArrowLeft className="h-4 w-4 text-foreground" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-foreground">{t('transport.title')}</h1>
            <p className="text-[11px] text-muted-foreground">{t('transport.subtitle')}</p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pb-8">
        <Tabs defaultValue="ferries" className="mt-4">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="ferries" className="text-xs">{t('transport.ferries')}</TabsTrigger>
            <TabsTrigger value="catamarans" className="text-xs">{t('transport.catamarans')}</TabsTrigger>
            <TabsTrigger value="citybus" className="text-xs">{t('transport.cityBus')}</TabsTrigger>
            <TabsTrigger value="intercity" className="text-xs">{t('transport.intercity')}</TabsTrigger>
          </TabsList>

          {/* Ferries */}
          <TabsContent value="ferries" className="space-y-2 mt-3">
            <p className="text-xs text-muted-foreground mb-1">{t('transport.nextFrom')} <span className="font-medium text-foreground">Gaženica / Gradska luka</span></p>
            {isLoading ? <LoadingState /> : ferries.length > 0 ? ferries.map((d, i) => (
              <ScheduleCard key={d.id} schedule={d} t={t} isNext={i === nextFerryIdx} />
            )) : (
              <p className="text-xs text-muted-foreground text-center py-6">Nema trajekata u rasporedu</p>
            )}
          </TabsContent>

          {/* Catamarans */}
          <TabsContent value="catamarans" className="space-y-2 mt-3">
            <p className="text-xs text-muted-foreground mb-1">{t('transport.fastLines')}</p>
            {isLoading ? <LoadingState /> : catamarans.length > 0 ? catamarans.map((d, i) => (
              <ScheduleCard key={d.id} schedule={d} t={t} isNext={i === nextCatIdx} />
            )) : (
              <p className="text-xs text-muted-foreground text-center py-6">Nema katamarana u rasporedu</p>
            )}
          </TabsContent>

          {/* City Bus */}
          <TabsContent value="citybus" className="mt-3">
            {isLoading ? <LoadingState /> : (
              <>
                <p className="text-xs text-muted-foreground mb-3">{t('transport.selectLine')}</p>

                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                  {busLineNames.map(name => (
                    <button
                      key={name}
                      onClick={() => setSelectedBusLine(name)}
                      className={`flex flex-col items-center min-w-[56px] px-3 py-2 rounded-xl border transition-all ${activeBusLine === name ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-card text-foreground hover:border-accent/40'}`}
                    >
                      <span className="text-xs font-bold">{name.replace('Linija ', '')}</span>
                    </button>
                  ))}
                </div>

                {activeBusLine && (
                  <div className="mt-3 p-4 rounded-xl bg-card border border-border">
                    <div className="mb-3">
                      <p className="text-sm font-semibold text-foreground">{activeBusLine}</p>
                      {selectedBusRoute && <p className="text-[11px] text-muted-foreground">{selectedBusRoute}</p>}
                      {(() => {
                        const note = getDaysNote(filteredBuses[0]?.days_of_week);
                        return note ? <p className="text-[10px] text-muted-foreground italic mt-1">⚠ {note}</p> : null;
                      })()}
                    </div>

                    <p className="text-[11px] text-muted-foreground mb-2">Cijeli dnevni raspored</p>
                    <div className="space-y-1.5 max-h-[50vh] overflow-y-auto">
                      {filteredBuses.length > 0 ? filteredBuses.map((bus, i) => {
                        const isPassed = i < nextBusIdx || nextBusIdx === -1;
                        const isNext = i === nextBusIdx;
                        return (
                          <div key={bus.id} className={`flex items-center justify-between p-2.5 rounded-lg ${isNext ? 'bg-accent/10 border border-accent/20' : isPassed ? 'bg-secondary/30 opacity-50' : 'bg-secondary/50'}`}>
                            <div className="flex items-center gap-2">
                              <Timer className="h-3.5 w-3.5 text-accent" />
                              <span className="text-sm font-semibold text-foreground">{formatTime(bus.departure_time)}</span>
                            </div>
                            {isNext ? (
                              <span className="text-xs font-medium text-accent">{getTimeRemaining(bus.departure_time)}</span>
                            ) : !isPassed ? (
                              <span className="text-[11px] text-muted-foreground">{getTimeRemaining(bus.departure_time)}</span>
                            ) : (
                              <span className="text-[11px] text-muted-foreground">prošlo</span>
                            )}
                          </div>
                        );
                      }) : (
                        <p className="text-xs text-muted-foreground text-center py-3">{t('transport.noMore')}</p>
                      )}
                    </div>
                  </div>
                )}

                {busLineNames.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-6">Nema gradskih autobusa u rasporedu</p>
                )}
              </>
            )}
          </TabsContent>

          {/* Intercity */}
          <TabsContent value="intercity" className="mt-3">
            <Input
              placeholder={t('transport.searchDestination')}
              value={intercitySearch}
              onChange={e => setIntercitySearch(e.target.value)}
              className="mb-3"
            />
            {isLoading ? <LoadingState /> : (
              <div className="space-y-2">
                {intercityBuses.map(d => {
                  const note = getDaysNote(d.days_of_week);
                  return (
                    <div key={d.id} className={`p-3 rounded-xl bg-card border border-border ${getBoardingStatus(d.departure_time) === 'closed' ? 'opacity-50' : ''}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{d.destination}</p>
                          <p className="text-[11px] text-muted-foreground">{d.carrier}{d.platform ? ` · ${t('transport.platform')} ${d.platform}` : ''}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-foreground">{formatTime(d.departure_time)}</p>
                          {getBoardingStatus(d.departure_time) === 'closed' ? (
                            <p className="text-[11px] text-muted-foreground">prošlo</p>
                          ) : (
                            <p className="text-[11px] text-accent font-medium">{getTimeRemaining(d.departure_time)}</p>
                          )}
                        </div>
                      </div>
                      {note && <p className="text-[10px] text-muted-foreground italic mt-1.5">⚠ {note}</p>}
                    </div>
                  );
                })}
                {intercityBuses.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-6">{t('transport.noResults')}</p>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
