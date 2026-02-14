import { VerificationStatus } from '@/data/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { ShieldCheck, Users, HelpCircle, AlertTriangle } from 'lucide-react';

interface TrustBadgeProps {
  status: VerificationStatus;
  size?: 'sm' | 'md';
}

export function TrustBadge({ status, size = 'sm' }: TrustBadgeProps) {
  const { t } = useLanguage();

  const config = {
    owner: {
      icon: ShieldCheck,
      label: t('trust.ownerVerified'),
      className: 'text-status-open bg-status-open/10',
    },
    community: {
      icon: Users,
      label: t('trust.communityConfirmed'),
      className: 'text-accent bg-accent/10',
    },
    unverified: {
      icon: HelpCircle,
      label: t('trust.unverified'),
      className: 'text-muted-foreground bg-muted',
    },
    possibly_incorrect: {
      icon: AlertTriangle,
      label: t('trust.possiblyIncorrect'),
      className: 'text-status-warning bg-status-warning/10',
    },
  };

  const c = config[status];
  const Icon = c.icon;
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs';

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium ${textSize} ${c.className}`}>
      <Icon className={iconSize} />
      {c.label}
    </span>
  );
}
