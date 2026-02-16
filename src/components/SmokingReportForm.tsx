import { useLanguage } from '@/contexts/LanguageContext';
import { useCafeSmokingStatus } from '@/hooks/useCafeSmokingStatus';
import { SmokingStatusBadge } from '@/components/SmokingStatusBadge';
import { Cigarette, Info } from 'lucide-react';

interface SmokingReportFormProps {
  businessId: string;
}

export function SmokingReportForm({ businessId }: SmokingReportFormProps) {
  const { t } = useLanguage();
  const { data, loading, submitReport, submitting, submitted, cooldown } = useCafeSmokingStatus(businessId);

  if (loading) return null;

  return (
    <div className="mb-6 p-4 rounded-2xl bg-card border border-border">
      <div className="flex items-center gap-2 mb-3">
        <Cigarette className="h-4 w-4 text-accent" />
        <h2 className="text-sm font-semibold text-foreground">{t('smoking.title')}</h2>
      </div>

      {/* Current status */}
      <div className="flex items-center gap-2 mb-3">
        <SmokingStatusBadge status={data.status} size="md" />
        {data.status && data.confidence > 0 && (
          <span className="text-xs text-muted-foreground">
            {t('smoking.confirmed')}: {data.confidence}%
          </span>
        )}
      </div>

      {/* Report buttons */}
      {!submitted && !cooldown && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">{t('smoking.reportStatus')}</p>
          <div className="flex gap-2">
            <button
              onClick={() => submitReport('allowed')}
              disabled={submitting}
              className="flex-1 py-2 rounded-xl text-xs font-medium bg-status-open/10 text-status-open hover:bg-status-open/20 transition-colors disabled:opacity-50"
            >
              🟢 {t('smoking.allowed')}
            </button>
            <button
              onClick={() => submitReport('partial')}
              disabled={submitting}
              className="flex-1 py-2 rounded-xl text-xs font-medium bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/20 transition-colors disabled:opacity-50"
            >
              🟡 {t('smoking.partial')}
            </button>
            <button
              onClick={() => submitReport('not_allowed')}
              disabled={submitting}
              className="flex-1 py-2 rounded-xl text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-50"
            >
              🔴 {t('smoking.notAllowed')}
            </button>
          </div>
        </div>
      )}

      {submitted && (
        <p className="text-xs text-status-open font-medium">{t('smoking.thankYou')}</p>
      )}

      {cooldown && !submitted && (
        <p className="text-xs text-muted-foreground">{t('smoking.cooldown')}</p>
      )}

      {/* Disclaimer */}
      <div className="mt-3 flex items-start gap-1.5">
        <Info className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          {t('smoking.disclaimer')}
        </p>
      </div>
    </div>
  );
}
