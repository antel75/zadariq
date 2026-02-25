import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  EvCharger,
  getChargerStatusColor,
  getChargerStatusBg,
  getChargerStatusLabel,
  getConfidenceLabel,
  useReportChargerStatus,
  distanceKm,
} from '@/hooks/useEvChargers';
import { Navigation, Zap, Clock, CheckCircle2, XCircle, AlertTriangle, Plug, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EvChargerCardProps {
  charger: EvCharger;
  userLat?: number;
  userLng?: number;
  reportCount?: number;
}

const PLUG_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  'Type2':   { label: 'Type 2',  color: 'text-blue-500',   bg: 'bg-blue-500/10' },
  'TYPE2':   { label: 'Type 2',  color: 'text-blue-500',   bg: 'bg-blue-500/10' },
  'TYPE2_COMBO': { label: 'CCS Combo', color: 'text-purple-500', bg: 'bg-purple-500/10' },
  'CCS':     { label: 'CCS',     color: 'text-purple-500', bg: 'bg-purple-500/10' },
  'CHAdeMO': { label: 'CHAdeMO', color: 'text-orange-500', bg: 'bg-orange-500/10' },
  'Tesla':   { label: 'Tesla',   color: 'text-red-500',    bg: 'bg-red-500/10' },
  'Schuko':  { label: 'Schuko',  color: 'text-gray-500',   bg: 'bg-gray-500/10' },
};

function getPlugDisplay(plug: string) {
  return PLUG_CONFIG[plug] || { label: plug, color: 'text-muted-foreground', bg: 'bg-muted/50' };
}

function getPowerInfo(kw: number): { label: string; color: string } {
  if (kw >= 100) return { label: 'Ultra brzo punjenje', color: 'text-purple-500' };
  if (kw >= 50)  return { label: 'Brzo punjenje', color: 'text-blue-500' };
  if (kw >= 22)  return { label: 'Polubrzo punjenje', color: 'text-green-500' };
  return { label: 'Sporo punjenje', color: 'text-muted-foreground' };
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'upravo';
  if (minutes < 60) return `prije ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `prije ${hours}h`;
  return `prije ${Math.floor(hours / 24)}d`;
}

export function EvChargerCard({ charger, userLat, userLng, reportCount = 0 }: EvChargerCardProps) {
  const { toast } = useToast();
  const reportMutation = useReportChargerStatus();
  const [justReported, setJustReported] = useState<string | null>(null);

  const statusColor = getChargerStatusColor(charger.status);
  const statusBg = getChargerStatusBg(charger.status);
  const statusLabel = getChargerStatusLabel(charger.status);
  const confidenceLabel = getConfidenceLabel(charger.confidence, reportCount);

  const distance = userLat && userLng
    ? distanceKm(userLat, userLng, charger.lat, charger.lng)
    : null;

  const timeSinceReport = charger.last_reported_at ? getTimeAgo(charger.last_reported_at) : null;
  const powerInfo = charger.power_kw ? getPowerInfo(charger.power_kw) : null;
  const validPlugs = charger.plug_types.filter(p => p !== 'UNKNOWN');

  const handleReport = async (status: string) => {
    try {
      await reportMutation.mutateAsync({ chargerId: charger.id, status });
      setJustReported(status);
      toast({ title: '✅ Hvala na prijavi!' });
      setTimeout(() => setJustReported(null), 5000);
    } catch (e: any) {
      toast({ title: '✅ Hvala na prijavi!' });
    }
  };

  const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${charger.lat},${charger.lng}`;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-sm text-foreground">{charger.name}</h3>
            {charger.operator && (
              <p className="text-xs text-muted-foreground">{charger.operator}</p>
            )}
            {charger.address && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                {charger.address}
              </p>
            )}
          </div>
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ml-2 flex-shrink-0 ${statusBg} ${statusColor}`}>
            {charger.status === 'available' && <CheckCircle2 className="h-3.5 w-3.5" />}
            {charger.status === 'busy' && <Clock className="h-3.5 w-3.5" />}
            {charger.status === 'broken' && <XCircle className="h-3.5 w-3.5" />}
            {charger.status === 'unknown' && <Plug className="h-3.5 w-3.5" />}
            {statusLabel}
          </div>
        </div>
        {charger.power_kw && powerInfo && (
          <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-muted/40">
            <Zap className={`h-4 w-4 flex-shrink-0 ${powerInfo.color}`} />
            <div className="flex-1">
              <span className={`text-xs font-bold ${powerInfo.color}`}>{charger.power_kw} kW</span>
              <span className="text-xs text-muted-foreground ml-1.5">— {powerInfo.label}</span>
            </div>
            {charger.plug_count > 1 && (
              <span className="text-xs text-muted-foreground">{charger.plug_count} mjesta</span>
            )}
          </div>
        )}
        {validPlugs.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {validPlugs.map(plug => {
              const cfg = getPlugDisplay(plug);
              return (
                <span key={plug} className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${cfg.bg} ${cfg.color}`}>
                  <Plug className="h-2.5 w-2.5" />
                  {cfg.label}
                </span>
              );
            })}
          </div>
        )}
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-3">
          {distance !== null && (
            <span className="flex items-center gap-0.5">
              <Navigation className="h-3 w-3" />
              {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)} km`}
            </span>
          )}
          <span className={charger.confidence >= 50 ? 'text-status-open' : ''}>{confidenceLabel}</span>
          {timeSinceReport && <span>· {timeSinceReport}</span>}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Button size="sm" variant={justReported === 'available' ? 'default' : 'outline'} className="h-7 text-xs gap-1 text-status-open border-status-open/30 hover:bg-status-open/10" onClick={() => handleReport('available')} disabled={reportMutation.isPending}>
            <CheckCircle2 className="h-3 w-3" /> Slobodno
          </Button>
          <Button size="sm" variant={justReported === 'busy' ? 'default' : 'outline'} className="h-7 text-xs gap-1 text-status-warning border-status-warning/30 hover:bg-status-warning/10" onClick={() => handleReport('busy')} disabled={reportMutation.isPending}>
            <Clock className="h-3 w-3" /> Zauzeto
          </Button>
          <Button size="sm" variant={justReported === 'broken' ? 'default' : 'outline'} className="h-7 text-xs gap-1 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => handleReport('broken')} disabled={reportMutation.isPending}>
            <AlertTriangle className="h-3 w-3" /> Ne radi
          </Button>
          <a href={navUrl} target="_blank" rel="noopener noreferrer" className="ml-auto flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors">
            <Navigation className="h-3 w-3" />
            Navigacija
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
