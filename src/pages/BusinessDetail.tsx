import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { businesses, isBusinessOpen, getTodayHours } from '@/data/mockData';
import { ReportModal } from '@/components/ReportModal';
import { ClaimModal } from '@/components/ClaimModal';
import {
  ArrowLeft, Phone, Navigation, Globe, BadgeCheck, AlertTriangle,
  UserCheck, Clock,
} from 'lucide-react';

const dayKeys = ['days.mon', 'days.tue', 'days.wed', 'days.thu', 'days.fri', 'days.sat', 'days.sun'] as const;
const hourKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

export default function BusinessDetail() {
  const { id } = useParams();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [showReport, setShowReport] = useState(false);
  const [showClaim, setShowClaim] = useState(false);

  const business = businesses.find(b => b.id === id);
  if (!business) return <div className="p-8 text-center text-muted-foreground">Not found</div>;

  const open = isBusinessOpen(business);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="text-base font-semibold text-foreground truncate">{business.name}</h1>
          {business.verified && <BadgeCheck className="h-4 w-4 text-accent flex-shrink-0" />}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pb-8">
        {/* Status */}
        <div className="mt-6 mb-4 flex items-center gap-3">
          <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${
            open ? 'bg-status-open text-status-open-foreground' : 'bg-status-closed text-status-closed-foreground'
          }`}>
            {open ? t('status.open') : t('status.closed')}
          </span>
          <span className="text-sm text-muted-foreground">{getTodayHours(business)}</span>
        </div>

        {business.reportCount >= 3 && (
          <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-status-warning/10 border border-status-warning/30">
            <AlertTriangle className="h-4 w-4 text-status-warning" />
            <span className="text-sm font-medium text-foreground">{t('status.possiblyIncorrect')}</span>
            <span className="text-xs text-muted-foreground ml-auto">{business.reportCount} reports</span>
          </div>
        )}

        {/* Address */}
        <div className="mb-6 p-4 rounded-2xl bg-card border border-border">
          <p className="text-sm text-foreground mb-3">{business.address}</p>
          <div className="flex gap-2">
            <a
              href={`tel:${business.phone}`}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
            >
              <Phone className="h-4 w-4" />
              {t('action.call')}
            </a>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-accent text-accent-foreground font-medium text-sm hover:bg-accent/90 transition-colors"
            >
              <Navigation className="h-4 w-4" />
              {t('action.navigate')}
            </a>
          </div>
        </div>

        {/* Working hours */}
        <div className="mb-6 p-4 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold text-foreground">{t('detail.workingHours')}</h2>
          </div>
          <div className="space-y-1.5">
            {dayKeys.map((dk, i) => (
              <div key={dk} className="flex justify-between text-sm">
                <span className="text-muted-foreground font-medium">{t(dk)}</span>
                <span className="text-foreground">{business.workingHours[hourKeys[i]]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Verified info */}
        <div className="mb-6 p-4 rounded-2xl bg-card border border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('detail.lastVerified')}</span>
            <span className="text-foreground">{business.lastVerified}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-muted-foreground">Status</span>
            <span className={`font-medium ${business.verified ? 'text-accent' : 'text-muted-foreground'}`}>
              {business.verified ? t('status.verified') : t('status.community')}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setShowReport(true)}
            className="w-full py-3 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            {t('action.report')}
          </button>
          <button
            onClick={() => setShowClaim(true)}
            className="w-full py-3 rounded-xl border border-accent text-sm font-medium text-accent hover:bg-accent/10 transition-colors flex items-center justify-center gap-2"
          >
            <UserCheck className="h-4 w-4" />
            {t('action.claimOwner')}
          </button>
        </div>
      </main>

      <ReportModal business={showReport ? business : null} open={showReport} onClose={() => setShowReport(false)} />
      <ClaimModal businessName={business.name} open={showClaim} onClose={() => setShowClaim(false)} />
    </div>
  );
}
