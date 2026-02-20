import { UserMode } from '@/hooks/useUserMode';
import { useLanguage } from '@/contexts/LanguageContext';
import { Home, Palmtree } from 'lucide-react';

interface ModePillSwitchProps {
  mode: UserMode;
  onToggle: (mode: UserMode) => void;
}

export function ModePillSwitch({ mode, onToggle }: ModePillSwitchProps) {
  const { t } = useLanguage();

  return (
    <div className="flex items-center justify-center">
      <div className="inline-flex items-center rounded-full bg-secondary/60 p-0.5 border border-border/50">
        <button
          onClick={() => onToggle('resident')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
            mode === 'resident'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Home className="h-3 w-3" />
          {t('mode.resident')}
        </button>
        <button
          onClick={() => onToggle('tourist')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
            mode === 'tourist'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Palmtree className="h-3 w-3" />
          {t('mode.tourist')}
        </button>
      </div>
    </div>
  );
}
