import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Bell, BellOff, Check } from 'lucide-react';

interface FollowButtonProps {
  businessId: string;
  businessName: string;
}

export function FollowButton({ businessId, businessName }: FollowButtonProps) {
  const { t } = useLanguage();
  const [following, setFollowing] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const handleToggle = () => {
    if (following) {
      setFollowing(false);
      setShowOptions(false);
    } else {
      setShowOptions(true);
    }
  };

  const handleFollow = () => {
    setFollowing(true);
    setShowOptions(false);
  };

  return (
    <div className="relative">
      <button
        onClick={handleToggle}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
          following
            ? 'bg-accent text-accent-foreground'
            : 'bg-muted text-muted-foreground hover:text-foreground'
        }`}
      >
        {following ? <BellOff className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
        {following ? t('follow.following') : t('follow.notify')}
      </button>

      {showOptions && (
        <div className="absolute top-full mt-2 right-0 w-56 p-3 rounded-2xl bg-card border border-border shadow-lg z-40">
          <p className="text-xs font-semibold text-foreground mb-2">{t('follow.options')}</p>
          {['follow.whenOpens', 'follow.whenQuiet', 'follow.newOffer'].map(key => (
            <button
              key={key}
              onClick={handleFollow}
              className="w-full text-left py-2 px-3 rounded-xl text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex items-center gap-2"
            >
              <Check className="h-3 w-3 text-accent" />
              {t(key)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
