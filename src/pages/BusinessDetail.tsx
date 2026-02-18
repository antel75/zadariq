import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { businesses, isBusinessOpen, getTodayHours, getRelativeTime } from '@/data/mockData';
import { ReportModal } from '@/components/ReportModal';
import { CorrectionPopup } from '@/components/CorrectionPopup';
import { ClaimModal } from '@/components/ClaimModal';
import { TrustBadge } from '@/components/TrustBadge';
import { TrustScore } from '@/components/TrustScore';
import { FollowButton } from '@/components/FollowButton';
import { SmokingReportForm } from '@/components/SmokingReportForm';
import {
  ArrowLeft, Phone, Navigation, BadgeCheck, AlertTriangle,
  UserCheck, Clock, ShieldCheck, Users, Bot, Activity, Tag, Megaphone, CalendarClock, Settings, Star,
} from 'lucide-react';
import { Footer } from '@/components/Footer';

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
  const hideOpenBadge = business.reportCount >= 5;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <CorrectionPopup entityType="business" entityId={business.id} fieldName="name" currentValue={business.name}>
            <h1 className="text-base font-semibold text-foreground truncate cursor-pointer hover:text-accent transition-colors">{business.name}</h1>
          </CorrectionPopup>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pb-8">
        {/* Status + Trust Badge */}
        <div className="mt-6 mb-4 flex items-center gap-3 flex-wrap">
          {hideOpenBadge ? (
            <span className="px-4 py-1.5 rounded-full text-sm font-bold bg-status-warning/20 text-status-warning">
              ⚠ {t('trust.warningHidden')}
            </span>
          ) : (
            <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${
              open ? 'bg-status-open text-status-open-foreground' : 'bg-status-closed text-status-closed-foreground'
            }`}>
              {open ? t('status.open') : t('status.closed')}
            </span>
          )}
          <TrustBadge status={business.verificationStatus} size="md" />
          <CorrectionPopup entityType="business" entityId={business.id} fieldName="workingHours" currentValue={getTodayHours(business)}>
            <span className="text-sm text-muted-foreground cursor-pointer hover:text-accent transition-colors">{getTodayHours(business)}</span>
          </CorrectionPopup>
          <div className="ml-auto">
            <FollowButton businessId={business.id} businessName={business.name} />
          </div>
        </div>

        {/* Warning */}
        {business.reportCount >= 3 && (
          <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-status-warning/10 border border-status-warning/30">
            <AlertTriangle className="h-4 w-4 text-status-warning" />
            <span className="text-sm font-medium text-foreground">{t('status.possiblyIncorrect')}</span>
            <span className="text-xs text-muted-foreground ml-auto">{business.reportCount} reports</span>
          </div>
        )}

        {/* Trust Score */}
        <div className="mb-6 p-4 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold text-foreground">{t('trust.dataReliability')}</h2>
          </div>
          <TrustScore score={business.trustScore} size="md" />
          
          {/* Last confirmed timestamps */}
          <div className="mt-3 space-y-1.5">
            {business.ownerVerifiedAt && (
              <div className="flex items-center gap-2 text-xs">
                <ShieldCheck className="h-3 w-3 text-status-open" />
                <span className="text-muted-foreground">{t('trust.lastOwner')}:</span>
                <span className="text-foreground font-medium">{getRelativeTime(business.ownerVerifiedAt)}</span>
              </div>
            )}
            {business.communityConfirmedAt && (
              <div className="flex items-center gap-2 text-xs">
                <Users className="h-3 w-3 text-accent" />
                <span className="text-muted-foreground">{t('trust.lastCommunity')}:</span>
                <span className="text-foreground font-medium">{getRelativeTime(business.communityConfirmedAt)}</span>
              </div>
            )}
            {business.lastAutoChecked && (
              <div className="flex items-center gap-2 text-xs">
                <Bot className="h-3 w-3 text-muted-foreground" />
                <span className="text-foreground">{t('trust.autoChecked')}</span>
              </div>
            )}
          </div>
        </div>

        {/* For customers today */}
        {(business.occupancy || business.dailyOffer || business.announcement || business.nextAppointment || business.waitTime) && (
          <div className="mb-6 p-4 rounded-2xl bg-card border border-accent/20">
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4 text-accent" />
              {t('biz.forCustomers')}
            </h2>
            <div className="space-y-2.5">
              {business.occupancy && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{t('biz.liveOccupancy')}</span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    business.occupancy === 'quiet' ? 'bg-status-open/20 text-status-open' :
                    business.occupancy === 'busy' ? 'bg-destructive/20 text-destructive' :
                    'bg-accent/20 text-accent'
                  }`}>
                    {t(`biz.occupancy.${business.occupancy}`)}
                  </span>
                </div>
              )}
              {business.waitTime && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{t('biz.waitTime')}</span>
                  <span className="text-xs font-medium text-foreground">{business.waitTime}</span>
                </div>
              )}
              {business.nextAppointment && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <CalendarClock className="h-3 w-3" />
                    {t('biz.nextAppt')}
                  </span>
                  <span className="text-xs font-medium text-foreground">{business.nextAppointment}</span>
                </div>
              )}
              {business.dailyOffer && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-accent/5 border border-accent/10">
                  <Tag className="h-3.5 w-3.5 text-accent flex-shrink-0" />
                  <span className="text-xs text-foreground">{business.dailyOffer}</span>
                </div>
              )}
              {business.announcement && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-primary/5 border border-primary/10">
                  <Megaphone className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                  <span className="text-xs text-foreground">{business.announcement}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Address + Actions */}
        <div className="mb-6 p-4 rounded-2xl bg-card border border-border">
          <CorrectionPopup entityType="business" entityId={business.id} fieldName="address" currentValue={business.address}>
            <p className="text-sm text-foreground mb-3 cursor-pointer hover:text-accent transition-colors">{business.address}</p>
          </CorrectionPopup>
          <div className="flex gap-2">
            <a
              href={`tel:${business.phone}`}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
            >
              <Phone className="h-4 w-4" />
              {t('action.call')}
            </a>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(business.name + ', ' + business.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-accent text-accent-foreground font-medium text-sm hover:bg-accent/90 transition-colors"
            >
              <Navigation className="h-4 w-4" />
              {t('action.navigate')}
            </a>
          </div>
          {business.category === 'restaurants' && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.name + ', ' + business.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center justify-center gap-2 py-3 rounded-xl bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 font-medium text-sm hover:bg-yellow-500/25 transition-colors"
            >
              <Star className="h-4 w-4" />
              Google Recenzije
            </a>
          )}
        </div>

        {/* Smoking status - only for cafes */}
        {business.category === 'cafes' && (
          <SmokingReportForm businessId={business.id} />
        )}

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
          {business.verificationStatus === 'owner' && (
            <button
              onClick={() => navigate(`/business/${business.id}/panel`)}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <Settings className="h-4 w-4" />
              {t('biz.panel')}
            </button>
          )}
        </div>
      </main>
      <Footer />
      <ReportModal business={showReport ? business : null} open={showReport} onClose={() => setShowReport(false)} />
      <ClaimModal businessId={business.id} businessName={business.name} open={showClaim} onClose={() => setShowClaim(false)} />
    </div>
  );
}
