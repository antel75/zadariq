import { Business, CategoryId } from '@/data/types';
import { isBusinessOpen, getTodayHours } from '@/data/mockData';
import { useLanguage } from '@/contexts/LanguageContext';
import { Phone, Navigation, AlertTriangle, BadgeCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BusinessCardProps {
  business: Business;
  onReport: (business: Business) => void;
}

export function BusinessCard({ business, onReport }: BusinessCardProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const open = isBusinessOpen(business);
  const todayHours = getTodayHours(business);

  return (
    <div
      className="bg-card rounded-2xl border border-border p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => navigate(`/business/${business.id}`)}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground truncate">{business.name}</h3>
            {business.verified && (
              <BadgeCheck className="h-4 w-4 text-accent flex-shrink-0" />
            )}
          </div>
          <p className="text-sm text-muted-foreground truncate">{business.address}</p>
        </div>
        <span
          className={`ml-2 px-3 py-1 rounded-full text-xs font-bold flex-shrink-0 ${
            open
              ? 'bg-status-open text-status-open-foreground'
              : 'bg-status-closed text-status-closed-foreground'
          }`}
        >
          {open ? t('status.open') : t('status.closed')}
        </span>
      </div>

      <p className="text-sm text-muted-foreground mb-3">
        {todayHours}
      </p>

      {business.reportCount >= 3 && (
        <div className="flex items-center gap-1.5 mb-3 text-status-warning">
          <AlertTriangle className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">{t('status.possiblyIncorrect')}</span>
        </div>
      )}

      <div className="flex items-center gap-2">
        <a
          href={`tel:${business.phone}`}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
        >
          <Phone className="h-3.5 w-3.5" />
          {t('action.call')}
        </a>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address)}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent text-accent-foreground text-xs font-medium hover:bg-accent/90 transition-colors"
        >
          <Navigation className="h-3.5 w-3.5" />
          {t('action.navigate')}
        </a>
        <button
          onClick={(e) => { e.stopPropagation(); onReport(business); }}
          className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
        >
          {t('action.report')}
        </button>
      </div>

      <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
        <span>{t('detail.lastVerified')}: {business.lastVerified}</span>
        <span>·</span>
        <span>{business.verified ? t('status.verified') : t('status.community')}</span>
      </div>
    </div>
  );
}
