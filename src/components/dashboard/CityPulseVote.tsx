import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { type ZoneId } from '@/hooks/useCityPulse';

interface Props {
  zoneId: ZoneId;
}

function getFingerprint(): string {
  const nav = navigator;
  const raw = [
    nav.userAgent,
    nav.language,
    screen.width,
    screen.height,
    new Date().getTimezoneOffset(),
  ].join('|');
  // Simple hash
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const chr = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

const COOLDOWN_KEY = 'citypulse_vote_';

export function CityPulseVote({ zoneId }: Props) {
  const { t } = useLanguage();
  const [submitting, setSubmitting] = useState(false);
  const [voted, setVoted] = useState(() => {
    const last = localStorage.getItem(COOLDOWN_KEY + zoneId);
    if (!last) return false;
    return Date.now() - parseInt(last) < 30 * 60 * 1000; // 30 min cooldown
  });

  const submit = async (level: 'quiet' | 'moderate' | 'lively') => {
    if (voted || submitting) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('city_pulse_votes').insert({
        zone_id: zoneId,
        vote_level: level,
        fingerprint_hash: getFingerprint(),
      });
      if (error) throw error;
      localStorage.setItem(COOLDOWN_KEY + zoneId, Date.now().toString());
      setVoted(true);
      toast.success(t('pulse.voteThanks'));
    } catch {
      toast.error(t('pulse.voteError'));
    } finally {
      setSubmitting(false);
    }
  };

  if (voted) {
    return (
      <p className="text-[11px] text-muted-foreground text-center mt-2">
        {t('pulse.voteSubmitted')}
      </p>
    );
  }

  const options = [
    { level: 'quiet' as const, label: t('pulse.vote.quiet'), emoji: '🌙' },
    { level: 'moderate' as const, label: t('pulse.vote.moderate'), emoji: '🟡' },
    { level: 'lively' as const, label: t('pulse.vote.lively'), emoji: '🔴' },
  ];

  return (
    <div className="mt-2 space-y-1.5">
      <p className="text-[11px] font-medium text-muted-foreground text-center">
        {t('pulse.voteQuestion')}
      </p>
      <div className="flex gap-2 justify-center">
        {options.map(o => (
          <button
            key={o.level}
            onClick={() => submit(o.level)}
            disabled={submitting}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-secondary/60 hover:bg-accent/15 text-xs font-medium text-foreground transition-all disabled:opacity-50"
          >
            <span>{o.emoji}</span>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
