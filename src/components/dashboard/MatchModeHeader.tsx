import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Clock, Car, Coffee, AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { type AppMode, type MatchEvent } from '@/hooks/useAppMode';

interface MatchModeHeaderProps {
  mode: AppMode;
  match: MatchEvent;
}

export function MatchModeHeader({ mode, match }: MatchModeHeaderProps) {
  const { t } = useLanguage();
  const emoji = match.sport === 'basketball' || match.team_tag?.includes('basketball') ? '🏀' : '⚽';
  const kickoff = new Date(match.start_time).toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' });

  const headerLabel = {
    pre_match: t('appMode.preMatch'),
    live_match: t('appMode.liveMatch'),
    post_match: t('appMode.postMatch'),
  }[mode];

  const statusColor = {
    pre_match: 'border-[hsl(var(--status-warning))]/50 bg-[hsl(var(--status-warning))]/5',
    live_match: 'border-destructive/50 bg-destructive/5',
    post_match: 'border-[hsl(var(--status-open))]/50 bg-[hsl(var(--status-open))]/5',
  }[mode];

  const badgeColor = {
    pre_match: 'bg-[hsl(var(--status-warning))] text-white',
    live_match: 'bg-destructive text-white',
    post_match: 'bg-[hsl(var(--status-open))] text-white',
  }[mode];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={mode}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.3 }}
        className="mb-4"
      >
        {/* Header Label */}
        <div className="flex items-center gap-2 mb-2">
          <Trophy className={`h-4 w-4 ${mode === 'live_match' ? 'text-destructive' : mode === 'post_match' ? 'text-[hsl(var(--status-open))]' : 'text-[hsl(var(--status-warning))]'}`} />
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">
            {headerLabel}
          </h2>
          {mode === 'live_match' && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
            </span>
          )}
        </div>

        {/* Main Match Card */}
        <div className={`rounded-xl border-2 ${statusColor} p-4 transition-colors`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>
              {mode === 'live_match' ? t('happening.liveBadge') : mode === 'pre_match' ? t('happening.soonBadge') : t('happening.finishedBadge')}
            </span>
            {match.league && (
              <span className="text-[10px] text-muted-foreground">{match.league}</span>
            )}
          </div>

          {/* Score / Teams */}
          <div className="flex items-center justify-center gap-4">
            <div className="text-right flex-1">
              <p className="text-sm font-bold text-foreground">{match.home_team}</p>
            </div>

            {mode === 'pre_match' ? (
              <div className="flex flex-col items-center">
                <Clock className="h-4 w-4 text-[hsl(var(--status-warning))] mb-1" />
                <p className="text-lg font-bold text-foreground">{kickoff}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <p className="text-2xl font-black text-foreground tabular-nums">
                  {match.home_score ?? 0} : {match.away_score ?? 0}
                </p>
                {mode === 'live_match' && match.match_minute && (
                  <p className="text-xs font-semibold text-destructive">{match.match_minute}'</p>
                )}
              </div>
            )}

            <div className="text-left flex-1">
              <p className="text-sm font-bold text-foreground">{match.away_team}</p>
            </div>
          </div>

          {/* Contextual Subtitle */}
          <p className="text-xs text-muted-foreground text-center mt-3">
            {mode === 'pre_match' && `${emoji} ${t('appMode.expectCrowds')}`}
            {mode === 'live_match' && `${emoji} ${t('appMode.cityWatching')}`}
            {mode === 'post_match' && `${emoji} ${t('appMode.talkingAbout')}`}
          </p>
        </div>

        {/* City Context — only during live */}
        {mode === 'live_match' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-2 grid grid-cols-3 gap-2"
          >
            {[
              { icon: Car, label: t('appMode.ctxParking'), color: 'text-[hsl(var(--status-warning))]' },
              { icon: Coffee, label: t('appMode.ctxCafes'), color: 'text-orange-400' },
              { icon: AlertTriangle, label: t('appMode.ctxTraffic'), color: 'text-[hsl(var(--status-warning))]' },
            ].map(({ icon: Icon, label, color }) => (
              <div key={label} className="flex items-center gap-1.5 p-2 rounded-lg bg-muted/30 border border-border">
                <Icon className={`h-3 w-3 ${color} shrink-0`} />
                <span className="text-[10px] text-muted-foreground leading-tight">{label}</span>
              </div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
