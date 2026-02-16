import { useLanguage } from '@/contexts/LanguageContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink, Thermometer, Droplets, Wind, Cloud, Sun, Waves, Users, Car } from 'lucide-react';

interface WeatherDetailProps {
  open: boolean;
  onClose: () => void;
  tempC: number;
  humidity: number;
  windKmh: number;
  windGustKmh: number;
  windDirection: number;
  weatherCode: number;
  sunrise: string;
  sunset: string;
}

export function WeatherDetailModal({ open, onClose, tempC, humidity, windKmh, windGustKmh, windDirection, weatherCode, sunrise, sunset }: WeatherDetailProps) {
  const { t } = useLanguage();

  const rows = [
    { icon: Thermometer, label: t('detail.temperature'), value: `${tempC}°C` },
    { icon: Droplets, label: t('detail.humidity'), value: `${humidity}%` },
    { icon: Wind, label: t('detail.wind'), value: `${windKmh} km/h` },
    { icon: Wind, label: t('detail.gusts'), value: `${windGustKmh} km/h` },
    { icon: Cloud, label: t('detail.direction'), value: `${windDirection}°` },
    { icon: Sun, label: t('detail.sunrise'), value: sunrise },
    { icon: Sun, label: t('detail.sunset'), value: sunset },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5 text-primary" />
            {t('detail.weatherTitle')}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {rows.map((r, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <r.icon className="h-4 w-4" />
                {r.label}
              </span>
              <span className="font-medium text-foreground">{r.value}</span>
            </div>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-2"
          onClick={() => window.open('https://www.dhmz.htnet.hr/prognoza/prognoza_detail.php?grad_id=100', '_blank')}
        >
          <ExternalLink className="h-3.5 w-3.5 mr-1" />
          {t('detail.openForecast')}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

interface CrowdDetailProps {
  open: boolean;
  onClose: () => void;
  crowdKey: string;
  hour: number;
}

export function CrowdDetailModal({ open, onClose, crowdKey, hour }: CrowdDetailProps) {
  const { t } = useLanguage();
  const isWeekend = [0, 6].includes(new Date().getDay());
  const month = new Date().getMonth();
  const isSummer = month >= 5 && month <= 8;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            {t('detail.crowdTitle')}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('detail.currentLevel')}</span>
            <span className="font-medium">{t(`today.crowd.${crowdKey}`)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('detail.timeNow')}</span>
            <span className="font-medium">{hour}:00</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('detail.weekend')}</span>
            <span className="font-medium">{isWeekend ? '✓' : '✗'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('detail.summer')}</span>
            <span className="font-medium">{isSummer ? '✓' : '✗'}</span>
          </div>
          <p className="text-xs text-muted-foreground pt-2 border-t border-border">
            {t('detail.crowdExplain')}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface SeaDetailProps {
  open: boolean;
  onClose: () => void;
  seaTempC: number;
  seaKey: string;
}

export function SeaDetailModal({ open, onClose, seaTempC, seaKey }: SeaDetailProps) {
  const { t } = useLanguage();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Waves className="h-5 w-5 text-primary" />
            {t('detail.seaTitle')}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('detail.seaTemp')}</span>
            <span className="font-medium">{seaTempC}°C</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('detail.seaFeeling')}</span>
            <span className="font-medium">{t(`today.sea.${seaKey}`)}</span>
          </div>
          <p className="text-xs text-muted-foreground pt-2 border-t border-border">
            {seaTempC < 18 ? t('detail.seaColdAdvice') : seaTempC < 23 ? t('detail.seaFreshAdvice') : t('detail.seaWarmAdvice')}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface MeteoAlertModalProps {
  open: boolean;
  onClose: () => void;
  alerts: Array<{ title: string; level: string; levelNum: number; type: string; description: string }>;
}

export function MeteoAlertModal({ open, onClose, alerts }: MeteoAlertModalProps) {
  const { t } = useLanguage();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('detail.meteoAlertTitle')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {alerts.map((alert, i) => (
            <div key={i} className="rounded-lg border border-border p-3 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-lg">⚠️</span>
                <span className="font-semibold text-sm">{alert.title}</span>
              </div>
              <p className="text-xs text-muted-foreground">{alert.description}</p>
              <span className={`text-xs font-medium ${alert.levelNum >= 3 ? 'text-destructive' : alert.levelNum >= 2 ? 'text-orange-500' : 'text-yellow-500'}`}>
                {alert.level}
              </span>
            </div>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-2"
          onClick={() => window.open('https://meteoalarm.org/en/live/', '_blank')}
        >
          <ExternalLink className="h-3.5 w-3.5 mr-1" />
          meteoalarm.org
        </Button>
      </DialogContent>
    </Dialog>
  );
}

interface WindDetailProps {
  open: boolean;
  onClose: () => void;
  windKmh: number;
  windGustKmh: number;
  windDirection: number;
  windName: string;
}

export function WindDetailModal({ open, onClose, windKmh, windGustKmh, windDirection, windName }: WindDetailProps) {
  const { t } = useLanguage();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wind className="h-5 w-5 text-primary" />
            {t('detail.windTitle')}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('detail.windType')}</span>
            <span className="font-medium capitalize">{windName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('detail.wind')}</span>
            <span className="font-medium">{windKmh} km/h</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('detail.gusts')}</span>
            <span className="font-medium">{windGustKmh} km/h</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('detail.direction')}</span>
            <span className="font-medium">{windDirection}°</span>
          </div>
          <p className="text-xs text-muted-foreground pt-2 border-t border-border">
            {t('detail.windAdvice')}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
