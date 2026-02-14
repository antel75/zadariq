import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Ship, Anchor, Bus, MapPin, Clock, ArrowLeft, Users,
  AlertTriangle, CheckCircle2, XCircle, Timer, Navigation, Wifi, WifiOff,
} from 'lucide-react';
import {
  ferryDepartures, cityBusLines, intercityDepartures,
  getTimeRemaining, getNextBusDepartures,
  type FerryDeparture, type BoardingStatus, type CrowdLevel,
} from '@/data/transportData';

const statusConfig: Record<BoardingStatus, { color: string; icon: typeof CheckCircle2; labelKey: string }> = {
  boarding: { color: 'text-[hsl(var(--status-open))]', icon: CheckCircle2, labelKey: 'transport.boarding' },
  scheduled: { color: 'text-muted-foreground', icon: Clock, labelKey: 'transport.scheduled' },
  delayed: { color: 'text-[hsl(var(--status-warning))]', icon: AlertTriangle, labelKey: 'transport.delayed' },
  closed: { color: 'text-[hsl(var(--status-closed))]', icon: XCircle, labelKey: 'transport.closed' },
};

const crowdConfig: Record<CrowdLevel, { color: string; labelKey: string }> = {
  low: { color: 'text-[hsl(var(--status-open))]', labelKey: 'crowd.low' },
  normal: { color: 'text-[hsl(var(--status-warning))]', labelKey: 'crowd.medium' },
  high: { color: 'text-[hsl(var(--status-closed))]', labelKey: 'crowd.high' },
};

function FerryCard({ dep, t, isNext }: { dep: FerryDeparture; t: (k: string) => string; isNext: boolean }) {
  const sc = statusConfig[dep.status];
  const StatusIcon = sc.icon;
  return (
    <div className={`p-3 rounded-xl bg-card border ${isNext ? 'border-accent ring-1 ring-accent/30' : 'border-border'} flex items-center justify-between gap-3`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className={`p-2 rounded-lg ${dep.type === 'catamaran' ? 'bg-accent/10 text-accent' : 'bg-primary/10 text-primary'}`}>
          {dep.type === 'catamaran' ? <Anchor className="h-4 w-4" /> : <Ship className="h-4 w-4" />}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{dep.destination}</p>
          <p className="text-[11px] text-muted-foreground">{dep.port}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right">
          <p className="text-sm font-bold text-foreground">{dep.departureTime}</p>
          {dep.status !== 'closed' && (
            <p className="text-[11px] text-accent font-medium">{getTimeRemaining(dep.departureTime)}</p>
          )}
        </div>
        <div className={`flex items-center gap-1 ${sc.color}`}>
          <StatusIcon className="h-3.5 w-3.5" />
          <span className="text-[10px] font-medium">{t(sc.labelKey)}</span>
        </div>
      </div>
    </div>
  );
}

export default function Transport() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [selectedBus, setSelectedBus] = useState(cityBusLines[0].id);
  const [intercitySearch, setIntercitySearch] = useState('');
  const [useLocation, setUseLocation] = useState(false);

  const ferries = ferryDepartures.filter(d => d.type === 'ferry');
  const catamarans = ferryDepartures.filter(d => d.type === 'catamaran');

  const nextFerryIdx = ferries.findIndex(d => d.status === 'boarding' || d.status === 'scheduled');
  const nextCatIdx = catamarans.findIndex(d => d.status === 'boarding' || d.status === 'scheduled');

  const selectedLine = cityBusLines.find(l => l.id === selectedBus)!;
  const nextBuses = getNextBusDepartures(selectedBus);

  const filteredIntercity = useMemo(() => {
    if (!intercitySearch.trim()) return intercityDepartures;
    const q = intercitySearch.toLowerCase();
    return intercityDepartures.filter(d => d.destination.toLowerCase().includes(q));
  }, [intercitySearch]);

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
          <div className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground">
            {useLocation ? <Wifi className="h-3 w-3 text-accent" /> : <WifiOff className="h-3 w-3" />}
            <span>{t('transport.cachedToday')}</span>
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
            <p className="text-xs text-muted-foreground mb-1">{t('transport.nextFrom')} <span className="font-medium text-foreground">Zadar Port / Gaženica</span></p>
            {ferries.map((d, i) => (
              <FerryCard key={d.id} dep={d} t={t} isNext={i === nextFerryIdx} />
            ))}
          </TabsContent>

          {/* Catamarans */}
          <TabsContent value="catamarans" className="space-y-2 mt-3">
            <p className="text-xs text-muted-foreground mb-1">{t('transport.fastLines')}</p>
            {catamarans.map((d, i) => (
              <FerryCard key={d.id} dep={d} t={t} isNext={i === nextCatIdx} />
            ))}
          </TabsContent>

          {/* City Bus */}
          <TabsContent value="citybus" className="mt-3">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground">{t('transport.selectLine')}</p>
              <button
                onClick={() => setUseLocation(!useLocation)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${useLocation ? 'bg-accent/15 text-accent' : 'bg-secondary text-secondary-foreground'}`}
              >
                <Navigation className="h-3 w-3" />
                {t('transport.useLocation')}
              </button>
            </div>

            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
              {cityBusLines.map(line => (
                <button
                  key={line.id}
                  onClick={() => setSelectedBus(line.id)}
                  className={`flex flex-col items-center min-w-[56px] px-3 py-2 rounded-xl border transition-all ${selectedBus === line.id ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-card text-foreground hover:border-accent/40'}`}
                >
                  <span className="text-base font-bold">{line.lineNumber}</span>
                </button>
              ))}
            </div>

            <div className="mt-3 p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{t('transport.line')} {selectedLine.lineNumber}</p>
                  <p className="text-[11px] text-muted-foreground">{selectedLine.route}</p>
                </div>
                <div className={`flex items-center gap-1 ${crowdConfig[selectedLine.crowdLevel].color}`}>
                  <Users className="h-3.5 w-3.5" />
                  <span className="text-[11px] font-medium">{t(crowdConfig[selectedLine.crowdLevel].labelKey)}</span>
                </div>
              </div>

              {useLocation && (
                <div className="flex items-center gap-1.5 mb-3 text-[11px] text-accent">
                  <MapPin className="h-3 w-3" />
                  <span>{t('transport.nearestStop')}: <span className="font-medium">{selectedLine.nearestStop}</span></span>
                </div>
              )}

              <p className="text-[11px] text-muted-foreground mb-2">{t('transport.nextDepartures')}</p>
              <div className="space-y-2">
                {nextBuses.length > 0 ? nextBuses.map((time, i) => (
                  <div key={time} className={`flex items-center justify-between p-2.5 rounded-lg ${i === 0 ? 'bg-accent/10 border border-accent/20' : 'bg-secondary/50'}`}>
                    <div className="flex items-center gap-2">
                      <Timer className="h-3.5 w-3.5 text-accent" />
                      <span className="text-sm font-semibold text-foreground">{time}</span>
                    </div>
                    <span className="text-xs font-medium text-accent">{getTimeRemaining(time)}</span>
                  </div>
                )) : (
                  <p className="text-xs text-muted-foreground text-center py-3">{t('transport.noMore')}</p>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Intercity */}
          <TabsContent value="intercity" className="mt-3">
            <Input
              placeholder={t('transport.searchDestination')}
              value={intercitySearch}
              onChange={e => setIntercitySearch(e.target.value)}
              className="mb-3"
            />
            <div className="space-y-2">
              {filteredIntercity.map(d => {
                const remaining = getTimeRemaining(d.departureTime);
                return (
                  <div key={d.id} className="p-3 rounded-xl bg-card border border-border flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{d.destination}</p>
                      <p className="text-[11px] text-muted-foreground">{d.carrier}{d.platform ? ` · ${t('transport.platform')} ${d.platform}` : ''}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">{d.departureTime}</p>
                      <p className="text-[11px] text-accent font-medium">{remaining}</p>
                    </div>
                  </div>
                );
              })}
              {filteredIntercity.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6">{t('transport.noResults')}</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
