import { useLanguage } from '@/contexts/LanguageContext';
import type { SmokingStatus } from '@/hooks/useCafeSmokingStatus';

interface SmokingStatusBadgeProps {
  status: SmokingStatus;
  size?: 'sm' | 'md';
}

const statusConfig: Record<string, { emoji: string; key: string; className: string }> = {
  allowed: { emoji: '🟢', key: 'smoking.allowed', className: 'bg-status-open/15 text-status-open' },
  partial: { emoji: '🟡', key: 'smoking.partial', className: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400' },
  not_allowed: { emoji: '🔴', key: 'smoking.notAllowed', className: 'bg-destructive/15 text-destructive' },
};

export function SmokingStatusBadge({ status, size = 'sm' }: SmokingStatusBadgeProps) {
  const { t } = useLanguage();

  if (!status) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full ${
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
      } bg-muted text-muted-foreground font-medium`}>
        ⚪️ {t('smoking.unconfirmed')}
      </span>
    );
  }

  const config = statusConfig[status];
  if (!config) return null;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full ${
      size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
    } ${config.className} font-medium`}>
      {config.emoji} {t(config.key)}
    </span>
  );
}
