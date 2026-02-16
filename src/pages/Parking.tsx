import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSelector } from '@/components/LanguageSelector';
import { ArrowLeft, Car, MessageSquare, AlertTriangle, ExternalLink } from 'lucide-react';
import { Footer } from '@/components/Footer';
import {
  parkingZones,
  getCurrentRegime,
  getParkingStatus,
  getRegimeLabel,
  getParkingHoursLabel,
  type ParkingRegime,
} from '@/data/parkingData';

function getPriceForRegime(zone: typeof parkingZones[0], regime: ParkingRegime) {
  return zone[regime];
}

const Parking = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const now = new Date();
  const regime = getCurrentRegime(now);
  const status = getParkingStatus(now);
  const regimeLabel = getRegimeLabel(regime);
  const hoursLabel = getParkingHoursLabel(now);

  const statusLabels = {
    free: { hr: 'BESPLATNO', en: 'FREE', de: 'KOSTENLOS', it: 'GRATUITO' },
    paid: { hr: 'NAPLATA', en: 'PAID', de: 'GEBÜHRENPFLICHTIG', it: 'A PAGAMENTO' },
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-foreground">Parking Zadar</h1>
              <p className="text-[11px] text-muted-foreground">{regimeLabel[language] || regimeLabel.hr}</p>
            </div>
          </div>
          <LanguageSelector />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pb-8">
        {/* Current status banner */}
        <section className="mt-4 mb-4">
          <div className={`rounded-2xl p-4 border ${status === 'free'
            ? 'bg-[hsl(var(--status-open))]/10 border-[hsl(var(--status-open))]/30'
            : 'bg-[hsl(var(--status-warning))]/10 border-[hsl(var(--status-warning))]/30'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Car className={`h-6 w-6 ${status === 'free' ? 'text-[hsl(var(--status-open))]' : 'text-[hsl(var(--status-warning))]'}`} />
                <div>
                  <span className={`text-lg font-bold ${status === 'free' ? 'text-[hsl(var(--status-open))]' : 'text-[hsl(var(--status-warning))]'}`}>
                    {statusLabels[status][language] || statusLabels[status].hr}
                  </span>
                  <p className="text-xs text-muted-foreground">{hoursLabel}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Notice: Branimir closed */}
        <section className="mb-4">
          <div className="rounded-2xl bg-destructive/10 border border-destructive/20 p-4">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  {language === 'hr' ? 'Parkiralište Branimir zatvoreno' : 'Branimir parking closed'}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {language === 'hr'
                    ? 'Sub 14.02. do ned 15.02.2026. — karnevalska povorka'
                    : 'Sat 14.02. to Sun 15.02.2026 — carnival parade'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Notice: Relja automat */}
        <section className="mb-5">
          <div className="rounded-2xl bg-accent/10 border border-accent/20 p-4">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-accent shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  {language === 'hr' ? 'Parking Relja — novi sustav' : 'Relja parking — new system'}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {language === 'hr'
                    ? 'Zatvoreni parking Ul. kneza Višeslava prelazi na parkirne automate.'
                    : 'Closed parking on Kneza Višeslava St. switching to ticket machines.'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Zone prices */}
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-foreground mb-3">
            {language === 'hr' ? 'Zone i cijene' : 'Zones & prices'}
          </h2>
          <div className="flex flex-col gap-2">
            {parkingZones.map(zone => {
              const price = getPriceForRegime(zone, regime);
              return (
                <div key={zone.id} className="rounded-xl bg-card border border-border p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">{zone.name}</span>
                      {zone.note && (
                        <span className="text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded-full">
                          {zone.note}
                        </span>
                      )}
                    </div>
                    <a
                      href={`sms:${zone.smsCode}`}
                      className="flex items-center gap-1 text-xs text-primary font-medium"
                    >
                      <MessageSquare className="h-3 w-3" />
                      {zone.smsCode}
                    </a>
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>{price.eurPerHour.toFixed(2)} €/sat</span>
                    {price.eurPerDay !== null && <span>{price.eurPerDay.toFixed(2)} €/dan</span>}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            {language === 'hr'
              ? 'Naknada mobilnom operateru: 0,13 €. Izvor: oil.hr'
              : 'Mobile operator fee: €0.13. Source: oil.hr'}
          </p>
        </section>

        {/* Useful links */}
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-foreground mb-3">
            {language === 'hr' ? 'Korisni linkovi' : 'Useful links'}
          </h2>
          <div className="flex flex-col gap-2">
            <a href="https://oil.hr/parking/" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl bg-card border border-border p-3 text-sm text-foreground hover:bg-secondary/50 transition-colors">
              <ExternalLink className="h-4 w-4 text-primary" />
              {language === 'hr' ? 'Interaktivna parking karta' : 'Interactive parking map'}
            </a>
            <a href="https://app.bmove.com/language/hr/?next=/odabir_karte/zadar/" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl bg-card border border-border p-3 text-sm text-foreground hover:bg-secondary/50 transition-colors">
              <ExternalLink className="h-4 w-4 text-primary" />
              e-Parking (bmove)
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Parking;
