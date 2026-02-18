import { Business } from '@/data/types';
import { isBusinessOpen, getTodayHours, getRelativeTime } from '@/data/mockData';
import { useLanguage } from '@/contexts/LanguageContext';
import { TrustBadge } from '@/components/TrustBadge';
import { TrustScore } from '@/components/TrustScore';
import { SmokingStatusInline } from '@/components/SmokingStatusInline';
import { useShopSundaySchedule, getNextSunday } from '@/hooks/useShopSundaySchedule';
import { Phone, Navigation, AlertTriangle, ShieldCheck, Users, Bot, Star, CalendarDays } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BusinessCardProps {
  business: Business;
  onReport: (business: Business) => void;
}

export function BusinessCard({ business, onReport }: BusinessCardProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { data: sundayEntries } = useShopSundaySchedule();
  const open = isBusinessOpen(business);
  const todayHours = getTodayHours(business);
  const hideOpenBadge = business.reportCount >= 5;
  const isShop = business.category === 'shops';
  const nextSunday = isShop && sundayEntries ? getNextSunday(sundayEntries, business.id) : null;

  return (
    <div
      className="bg-card rounded-2xl border border-border p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => navigate(`/business/${business.id}`)}
    >
      {/* Name + Trust badge + Status */}
      <div className="mb-2">
        <h3 className="font-semibold text-foreground mb-1">{business.name}</h3>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <TrustBadge status={business.verificationStatus} />
            <p className="text-sm text-muted-foreground truncate">{business.address}</p>
          </div>
        {hideOpenBadge ? (
          <span className="ml-2 px-3 py-1 rounded-full text-xs font-bold flex-shrink-0 bg-status-warning/20 text-status-warning">
            ⚠
          </span>
        ) : open !== null ? (
          <span
            className={`ml-2 px-3 py-1 rounded-full text-xs font-bold flex-shrink-0 ${
              open
                ? 'bg-status-open text-status-open-foreground'
                : 'bg-status-closed text-status-closed-foreground'
            }`}
          >
            {open ? t('status.open') : t('status.closed')}
          </span>
        ) : null}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <p className="text-sm text-muted-foreground">{todayHours}</p>
        {business.category === 'cafes' && <SmokingStatusInline businessId={business.id} />}
        {nextSunday && (
          <span className="flex items-center gap-1 text-xs font-medium text-primary">
            <CalendarDays className="h-3 w-3" />
            Ned. {new Date(nextSunday.sunday_date + 'T00:00:00').toLocaleDateString('hr', { day: 'numeric', month: 'short' })}
            {' '}{(nextSunday.open_time || '08:00').slice(0, 5)}–{(nextSunday.close_time || '21:00').slice(0, 5)}
          </span>
        )}
      </div>

      {/* Warning for 5+ reports */}
      {business.reportCount >= 5 && (
        <div className="flex items-center gap-1.5 mb-2 p-2 rounded-lg bg-status-warning/10 border border-status-warning/20">
          <AlertTriangle className="h-3.5 w-3.5 text-status-warning" />
          <span className="text-xs font-medium text-status-warning">{t('trust.warningHidden')}</span>
        </div>
      )}

      {/* Warning for 3-4 reports */}
      {business.reportCount >= 3 && business.reportCount < 5 && (
        <div className="flex items-center gap-1.5 mb-2 text-status-warning">
          <AlertTriangle className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">{t('status.possiblyIncorrect')}</span>
        </div>
      )}

      {/* Trust score bar */}
      <div className="mb-3">
        <TrustScore score={business.trustScore} />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <a
          href={`tel:${business.phone}`}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
        >
          <Phone className="h-3.5 w-3.5" />
          {t('action.call')}
        </a>
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(business.name + ', ' + business.address)}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent text-accent-foreground text-xs font-medium hover:bg-accent/90 transition-colors"
        >
          <Navigation className="h-3.5 w-3.5" />
          {t('action.navigate')}
        </a>
        {business.category === 'restaurants' && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.name + ', ' + business.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 text-xs font-medium hover:bg-yellow-500/25 transition-colors"
          >
            <Star className="h-3.5 w-3.5" />
            Recenzije
          </a>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onReport(business); }}
          className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
        >
          {t('action.report')}
        </button>
      </div>

      {/* Last confirmed timestamps */}
      <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground flex-wrap">
        {business.ownerVerifiedAt && (
          <span className="flex items-center gap-0.5">
            <ShieldCheck className="h-2.5 w-2.5 text-status-open" />
            {getRelativeTime(business.ownerVerifiedAt)}
          </span>
        )}
        {business.communityConfirmedAt && (
          <span className="flex items-center gap-0.5">
            <Users className="h-2.5 w-2.5 text-accent" />
            {getRelativeTime(business.communityConfirmedAt)}
          </span>
        )}
        {business.lastAutoChecked && (
          <span className="flex items-center gap-0.5">
            <Bot className="h-2.5 w-2.5" />
            {t('trust.autoChecked')}
          </span>
        )}
      </div>
    </div>
  );
}
