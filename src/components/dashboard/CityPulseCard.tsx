import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { type ZonePulse, type PulseLevel } from '@/hooks/useCityPulse';
import { cn } from '@/lib/utils';

interface Props {
  pulse: ZonePulse;
  isSelected: boolean;
  onClick: () => void;
  fullWidth?: boolean;
}

const levelColors: Record<PulseLevel, string> = {
  quiet: 'border-muted-foreground/20 bg-muted/30',
  light: 'border-emerald-500/30 bg-emerald-500/5',
  pleasant: 'border-yellow-500/30 bg-yellow-500/5',
  lively: 'border-orange-500/30 bg-orange-500/5',
  peak: 'border-red-500/30 bg-red-500/5',
};

const pulseAnimation: Record<PulseLevel, string> = {
  quiet: '',
  light: '',
  pleasant: '',
  lively: 'animate-pulse',
  peak: 'animate-pulse',
};

export function CityPulseCard({ pulse, isSelected, onClick, fullWidth }: Props) {
  const { t } = useLanguage();

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={cn(
        'relative rounded-xl border p-3 text-left transition-all duration-200',
        levelColors[pulse.level],
        isSelected && 'ring-2 ring-accent/40',
        fullWidth ? 'col-span-2' : ''
      )}
    >
      {/* Pulse dot */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-foreground truncate">
          {t(pulse.zone.nameKey)}
        </span>
        <span className={cn('text-base', pulseAnimation[pulse.level])}>
          {pulse.emoji}
        </span>
      </div>
      <p className="text-[11px] font-medium text-foreground/80">
        {t(pulse.labelKey)}
      </p>
      <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
        {t(pulse.descriptionKey)}
      </p>
    </motion.button>
  );
}
