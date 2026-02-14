import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Pill, Stethoscope, Siren, Ship, Car, Loader2, Phone, ExternalLink } from 'lucide-react';
import { useNextFerry, formatTime, getTimeRemaining } from '@/hooks/useTransportSchedules';
import { getParkingStatus } from '@/data/parkingData';

interface NowCard {
  icon: React.ElementType;
  iconColor: string;
  label: string;
  answer: string;
  action: () => void;
}

export function NowInZadar() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { nextFerry, isLoading } = useNextFerry();

  const parkingStatus = getParkingStatus();

  const cards: NowCard[] = [
    {
      icon: Pill,
      iconColor: 'text-[hsl(var(--status-open))]',
      label: t('now.pharmacy'),
      answer: 'Ljekarna Jadran — 0-24',
      action: () => window.open('https://maps.app.goo.gl/MzSeHLC1RCqsJ45b6?g_st=ic', '_blank'),
    },
    {
      icon: Stethoscope,
      iconColor: 'text-destructive',
      label: t('now.emergencyMedical'),
      answer: t('now.emergencyMedicalAnswer'),
      action: () => navigate('/emergency'),
    },
    {
      icon: Ship,
      iconColor: 'text-accent',
      label: t('now.nextFerry'),
      answer: isLoading
        ? '...'
        : nextFerry
          ? `${nextFerry.destination || nextFerry.route} — ${formatTime(nextFerry.departure_time)} (${getTimeRemaining(nextFerry.departure_time)})`
          : t('now.noFerry'),
      action: () => navigate('/transport'),
    },
    {
      icon: Car,
      iconColor: 'text-primary',
      label: t('now.parking'),
      answer: parkingStatus === 'free' ? t('now.parkingFree') : t('now.parkingPaid'),
      action: () => navigate('/parking'),
    },
  ];

  return (
    <div>
      <h2 className="text-sm font-bold text-foreground mb-2 uppercase tracking-wide">
        {t('now.title')}
      </h2>
      <div className="grid grid-cols-2 gap-2">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <button
              key={i}
              onClick={card.action}
              className="flex items-start gap-2.5 p-3 rounded-xl bg-card border border-border hover:border-accent/40 transition-colors text-left"
            >
              <div className="p-1.5 rounded-lg bg-muted/50 shrink-0">
                <Icon className={`h-4 w-4 ${card.iconColor}`} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{card.label}</p>
                <p className="text-xs font-semibold text-foreground mt-0.5 leading-tight">{card.answer}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
