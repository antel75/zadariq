import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCityPulse, type ZonePulse, type ZoneId } from '@/hooks/useCityPulse';
import { CityPulseCard } from './CityPulseCard';
import { CityPulseDetail } from './CityPulseDetail';
import { CityPulseVote } from './CityPulseVote';
import { Activity, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function CityPulseSection() {
  const { t } = useLanguage();
  const { zones, loading, recommendationKey } = useCityPulse();
  const [selectedZone, setSelectedZone] = useState<ZoneId | null>(null);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-5 w-32 bg-muted/50 rounded animate-pulse" />
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 bg-muted/30 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const selected = zones.find(z => z.zone.id === selectedZone);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-semibold text-foreground">{t('pulse.title')}</h2>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="p-1 rounded-lg hover:bg-muted/50 transition-colors">
              <Info className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-[260px] text-xs">
            {t('pulse.privacy')}
          </TooltipContent>
        </Tooltip>
      </div>

      <p className="text-[11px] text-muted-foreground -mt-1">{t('pulse.subtitle')}</p>

      {/* Recommendation banner */}
      {recommendationKey && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="px-3 py-2 rounded-xl bg-accent/10 border border-accent/20"
        >
          <p className="text-xs font-medium text-accent">{t(recommendationKey)}</p>
        </motion.div>
      )}

      {/* Zone grid */}
      <div className="grid grid-cols-2 gap-2">
        {zones.slice(0, 4).map(zp => (
          <CityPulseCard
            key={zp.zone.id}
            pulse={zp}
            isSelected={selectedZone === zp.zone.id}
            onClick={() => setSelectedZone(selectedZone === zp.zone.id ? null : zp.zone.id)}
          />
        ))}
      </div>
      {/* 5th zone full width */}
      {zones[4] && (
        <CityPulseCard
          pulse={zones[4]}
          isSelected={selectedZone === zones[4].zone.id}
          onClick={() => setSelectedZone(selectedZone === zones[4].zone.id ? null : zones[4].zone.id)}
          fullWidth
        />
      )}

      {/* Detail panel */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CityPulseDetail pulse={selected} />
            <CityPulseVote zoneId={selected.zone.id} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
