import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSelector } from '@/components/LanguageSelector';
import { ArrowLeft, Car, MessageSquare, ExternalLink } from 'lucide-react';
import { Footer } from '@/components/Footer';
import { useIsHoliday } from '@/hooks/useIsHoliday';
import {
  parkingZones,
  getCurrentRegime,
  getRegimeLabel,
  type ParkingRegime,
} from '@/data/parkingData';

type ZoneStatus = 'free' | 'cheap' | 'expensive';

function getZoneStatus(zoneId: string, regime: ParkingRegime, now: Date, price?: { eurPerHour: number }, isHoliday: boolean = false): ZoneStatus {
  if (price && price.eurPerHour === 0) return 'free';
  // Public holidays: free except in peak summer & Zona 0 (always charged)
  if (isHoliday && regime !== 'peakSummer' && zoneId !== 'zona-0') return 'free';
  const day = now.getDay();
  const h = now.getHours();
  const m = now.getMinutes();
  const t = h * 60 + m;

  if (zoneId === 'zona-0') return regime === 'peakSummer' ? 'expensive' : 'cheap';

  if (regime === 'winter') {
    if (day === 0) return 'free';
    if (day === 6) return (t >= 480 && t < 840) ? 'cheap' : 'free';
    return (t >= 480 && t < 960) ? 'cheap' : 'free';
  }
  // summer / peakSummer
  if (day === 0 && regime !== 'peakSummer') return 'free';
  if (t >= 480 && t < 1320) return regime === 'peakSummer' ? 'expensive' : 'cheap';
  return 'free';
}

function getUntilLabel(zoneId: string, regime: ParkingRegime, now: Date, language: string, isHoliday: boolean = false): string {
  const day = now.getDay();
  const h = now.getHours();
  const m = now.getMinutes();
  const t = h * 60 + m;

  if (zoneId === 'zona-0') {
    return language === 'hr' ? 'Uvijek se naplaćuje' : 'Always charged';
  }

  const freeLabel = language === 'hr' ? 'Besplatno' : 'Free';
  const paidUntil = (until: string) => language === 'hr' ? `Naplata do ${until}` : `Paid until ${until}`;

  // Public holidays: free (except peak summer)
  if (isHoliday && regime !== 'peakSummer') {
    return language === 'hr' ? 'Besplatno (praznik)' : 'Free (holiday)';
  }

  if (regime === 'winter') {
    if (day === 0) return freeLabel;
    if (day === 6) {
      if (t >= 480 && t < 840) return paidUntil('14:00');
      return freeLabel;
    }
    if (t >= 480 && t < 960) return paidUntil('16:00');
    return freeLabel;
  }
  if (day === 0 && regime !== 'peakSummer') return freeLabel;
  if (t >= 480 && t < 1320) return paidUntil('22:00');
  return freeLabel;
}

const statusColors: Record<ZoneStatus, { bg: string; border: string; text: string; dot: string }> = {
  free:      { bg: 'bg-green-500/10',  border: 'border-green-500/30',  text: 'text-green-500',  dot: 'bg-green-500' },
  cheap:     { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-500', dot: 'bg-yellow-500' },
  expensive: { bg: 'bg-red-500/10',    border: 'border-red-500/30',    text: 'text-red-500',    dot: 'bg-red-500' },
};

const statusLabel: Record<ZoneStatus, Record<string, string>> = {
  free:      { hr: 'BESPLATNO', en: 'FREE',       de: 'KOSTENLOS',           it: 'GRATUITO' },
  cheap:     { hr: 'NAPLATA',   en: 'PAID',        de: 'GEBÜHRENPFLICHTIG',   it: 'A PAGAMENTO' },
  expensive: { hr: 'NAPLATA',   en: 'PAID',        de: 'GEBÜHRENPFLICHTIG',   it: 'A PAGAMENTO' },
};

const Parking = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const now = new Date();
  const regime = getCurrentRegime(now);
  const regimeLabel = getRegimeLabel(regime);
  const { data: holidayInfo } = useIsHoliday();
  const isHoliday = holidayInfo?.isHoliday ?? false;

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
        {/* Legend */}
        <section className="mt-4 mb-4 flex gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block"/> {language === 'hr' ? 'Besplatno' : 'Free'}</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500 inline-block"/> {language === 'hr' ? 'Jeftinije' : 'Cheaper'}</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block"/> {language === 'hr' ? 'Skuplje' : 'Expensive'}</span>
        </section>

        {/* Zone cards */}
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-foreground mb-3">
            {language === 'hr' ? 'Zone i cijene' : 'Zones & prices'}
          </h2>
          <div className="flex flex-col gap-2">
            {parkingZones.map(zone => {
              const zoneStatus = getZoneStatus(zone.id, regime, now, zone[regime], isHoliday);
              const colors = statusColors[zoneStatus];
              const price = zone[regime];
              const until = getUntilLabel(zone.id, regime, now, language, isHoliday);

              return (
                <div key={zone.id} className={`rounded-xl border p-3 ${colors.bg} ${colors.border}`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${colors.dot}`} />
                      <span className="text-sm font-bold text-foreground">{zone.name}</span>
                      {zone.note && (
                        <span className="text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded-full">
                          {zone.note}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${colors.text}`}>
                        {statusLabel[zoneStatus][language] || statusLabel[zoneStatus].hr}
                      </span>
                      <a href={`sms:${zone.smsCode}`} className="flex items-center gap-1 text-xs text-primary font-medium">
                        <MessageSquare className="h-3 w-3" />
                        {zone.smsCode}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                    <div className="flex gap-3">
                      {zoneStatus !== 'free' && (
                        <>
                          <span className={`font-semibold ${colors.text}`}>{price.eurPerHour.toFixed(2)} €/sat</span>
                          {price.eurPerDay !== null && <span>{price.eurPerDay.toFixed(2)} €/dan</span>}
                        </>
                      )}
                    </div>
                    <span className="text-[11px]">{until}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            {language === 'hr' ? 'Naknada mobilnom operateru: 0,13 €. Izvor: oil.hr' : 'Mobile operator fee: €0.13. Source: oil.hr'}
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
