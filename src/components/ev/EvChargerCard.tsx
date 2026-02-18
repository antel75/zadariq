import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  EvCharger,
  getChargerStatusColor,
  getChargerStatusBg,
  getChargerStatusLabel,
  getConfidenceLabel,
  useReportChargerStatus,
  distanceKm,
} from '@/hooks/useEvChargers';
import { Navigation, Zap, Clock, CheckCircle2, XCircle, AlertTriangle, Plug } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EvChargerCardProps {
  charger: EvCharger;
  userLat?: number;
  userLng?: number;
  reportCount?: number;
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

  const timeSinceReport = charger.last_reported_at
    ? getTimeAgo(charger.last_reported_at)
    : null;

  const handleReport = async (status: string) => {
    try {
      await reportMutation.mutateAsync({ chargerId: charger.id, status });
      setJustReported(status);
      toast({ title: '✅ Hvala na prijavi!' });
      setTimeout(() => setJustReported(null), 5000);
    } catch (e: any) {
      if (e.message === 'cooldown') {
        // Deceptive feedback - still show success
        toast({ title: '✅ Hvala na prijavi!' });
      } else {
        toast({ title: '✅ Hvala na prijavi!' }); // Always show success
      }
    }
  };

  const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${charger.lat},${charger.lng}`;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-3">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-sm text-foreground truncate">{charger.name}</h3>
            {charger.operator && (
              <p className="text-xs text-muted-foreground truncate">{charger.operator}</p>
            )}
          </div>
          <Badge className={`${statusBg} ${statusColor} border-0 text-[10px] font-bold ml-2 flex-shrink-0`}>
            {charger.status === 'available' && <CheckCircle2 className="h-3 w-3 mr-0.5" />}
            {charger.status === 'busy' && <Clock className="h-3 w-3 mr-0.5" />}
            {charger.status === 'broken' && <XCircle className="h-3 w-3 mr-0.5" />}
            {charger.status === 'unknown' && <Plug className="h-3 w-3 mr-0.5" />}
            {statusLabel}
          </Badge>
        </div>

        {/* Info row */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-2">
          {charger.plug_types.length > 0 && charger.plug_types[0] !== 'UNKNOWN' && (
            <span className="flex items-center gap-0.5">
              <Plug className="h-3 w-3" />
              {charger.plug_types.join(', ')}
            </span>
          )}
          {charger.power_kw && (
            <span className="flex items-center gap-0.5">
              <Zap className="h-3 w-3" />
              {charger.power_kw} kW
            </span>
          )}
          {charger.plug_count > 1 && (
            <span>{charger.plug_count} mjesta</span>
          )}
          {distance !== null && (
            <span className="flex items-center gap-0.5">
              <Navigation className="h-3 w-3" />
              {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)} km`}
            </span>
          )}
        </div>

        {/* Confidence & time */}
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-3">
          <span className={charger.confidence >= 50 ? 'text-status-open' : ''}>{confidenceLabel}</span>
          {timeSinceReport && <span>· ažurirano {timeSinceReport}</span>}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Button
            size="sm"
            variant={justReported === 'available' ? 'default' : 'outline'}
            className="h-7 text-xs gap-1 text-status-open border-status-open/30 hover:bg-status-open/10"
            onClick={() => handleReport('available')}
            disabled={reportMutation.isPending}
          >
            <CheckCircle2 className="h-3 w-3" /> Slobodno
          </Button>
          <Button
            size="sm"
            variant={justReported === 'busy' ? 'default' : 'outline'}
            className="h-7 text-xs gap-1 text-status-warning border-status-warning/30 hover:bg-status-warning/10"
            onClick={() => handleReport('busy')}
            disabled={reportMutation.isPending}
          >
            <Clock className="h-3 w-3" /> Zauzeto
          </Button>
          <Button
            size="sm"
            variant={justReported === 'broken' ? 'default' : 'outline'}
            className="h-7 text-xs gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={() => handleReport('broken')}
            disabled={reportMutation.isPending}
          >
            <AlertTriangle className="h-3 w-3" /> Ne radi
          </Button>
          <a
            href={navUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
          >
            <Navigation className="h-3 w-3" />
            Navigacija
          </a>
        </div>
      </CardContent>
    </Card>
  );
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
