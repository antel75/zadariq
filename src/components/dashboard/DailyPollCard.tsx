import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDailyPoll } from '@/hooks/useDailyPoll';
import { BarChart3, Vote } from 'lucide-react';

const contextEmoji: Record<string, string> = {
  bura: '💨',
  rain: '🌧️',
  heat: '🥵',
  cold: '❄️',
  match_live: '⚽',
  weekend: '🌙',
  calm: '☀️',
};

export function DailyPollCard() {
  const { t } = useLanguage();
  const { poll, loading, voted, votedOptionId, submitting, vote } = useDailyPoll();

  if (loading) {
    return (
      <div className="rounded-2xl bg-card/80 border border-border/50 p-4 space-y-3">
        <div className="h-4 w-24 bg-muted/50 rounded animate-pulse" />
        <div className="h-5 w-48 bg-muted/40 rounded animate-pulse" />
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-10 bg-muted/30 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!poll) return null;

  const emoji = contextEmoji[poll.context_key] || '📊';
  const maxVotes = Math.max(...poll.options.map(o => o.votes), 1);

  return (
    <div className="rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Vote className="h-4 w-4 text-accent" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Puls grada
        </span>
        <span className="text-sm">{emoji}</span>
      </div>

      {/* Question */}
      <h3 className="text-sm font-bold text-foreground leading-snug">
        {poll.question_text}
      </h3>

      {/* Options */}
      <div className="space-y-2">
        <AnimatePresence mode="wait">
          {poll.options.map((option) => {
            const isSelected = votedOptionId === option.id;

            if (voted) {
              // Show results
              return (
                <motion.div
                  key={option.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`relative rounded-xl overflow-hidden border ${
                    isSelected
                      ? 'border-accent/50 bg-accent/5'
                      : 'border-border/30 bg-secondary/30'
                  }`}
                >
                  {/* Bar */}
                  <motion.div
                    className={`absolute inset-y-0 left-0 ${
                      isSelected ? 'bg-accent/20' : 'bg-muted/40'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${option.percent}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                  <div className="relative flex items-center justify-between px-3 py-2.5">
                    <span className={`text-xs font-medium ${isSelected ? 'text-accent' : 'text-foreground'}`}>
                      {isSelected && '✓ '}{option.text}
                    </span>
                    <span className={`text-xs font-bold ${isSelected ? 'text-accent' : 'text-muted-foreground'}`}>
                      {option.percent}%
                    </span>
                  </div>
                </motion.div>
              );
            }

            // Show vote buttons
            return (
              <motion.button
                key={option.id}
                onClick={() => vote(option.id)}
                disabled={submitting}
                className="w-full text-left px-3 py-2.5 rounded-xl border border-border/40 bg-secondary/40 hover:bg-accent/10 hover:border-accent/30 text-xs font-medium text-foreground transition-all duration-200 disabled:opacity-50"
                whileTap={{ scale: 0.98 }}
              >
                {option.text}
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <BarChart3 className="h-3 w-3" />
          <span>{poll.total_votes} {poll.total_votes === 1 ? 'glas' : 'glasova'}</span>
        </div>
        {voted && (
          <p className="text-[10px] text-muted-foreground">
            Hvala na glasu!
          </p>
        )}
      </div>

      {/* Privacy note */}
      <p className="text-[9px] text-muted-foreground/60 text-center leading-tight">
        Rezultati su informativni i anonimni — prikazuju raspoloženje zajednice.
      </p>
    </div>
  );
}
