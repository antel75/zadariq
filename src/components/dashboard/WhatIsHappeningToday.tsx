import { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getZadarHour } from '@/hooks/useSituationalMode';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, AlertTriangle, Car, Construction, Ship, Megaphone,
  Coffee, ExternalLink, Zap, Droplets, Wind
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────
interface FeedCard {
  id: string;
  priority: number;
  type: 'live_sport' | 'upcoming_sport' | 'finished_sport' | 'weather_warning' | 'traffic' | 'city_event' | 'fallback';
  icon: LucideIcon;
  iconColor: string;
  accentClass: string; // border/bg accent
  title: string;
  subtitle: string;
  badge?: string;
  badgeClass?: string;
  link?: string;
  pulsing?: boolean;
}

// ─── Hooks ───────────────────────────────────────────────
function useSportsEvents() {
  return useQuery({
    queryKey: ['sports-events-today'],
    queryFn: async () => {
      const now = new Date();
      const past24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('sports_events')
        .select('*')
        .gte('start_time', past24h)
        .lte('start_time', next24h)
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

function useCityAlertsForFeed() {
  return useQuery({
    queryKey: ['city-alerts-feed'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('city_alerts')
        .select('*')
        .gt('valid_until', new Date().toISOString())
        .order('priority', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    staleTime: 2 * 60 * 1000,
    refetchInterval: 60 * 1000,
  });
}

function useTodayOutagesForFeed() {
  return useQuery({
    queryKey: ['outages-feed'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const [power, water] = await Promise.all([
        supabase.from('power_outages').select('*').eq('outage_date', today),
        supabase.from('water_outages').select('*').eq('outage_date', today),
      ]);
      return {
        power: power.data || [],
        water: water.data || [],
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Highlight keywords ──────────────────────────────────
const HIGHLIGHT_WORDS = ['zatvoreno', 'bura', 'zabrana', 'radovi', 'posebna regulacija', 'closed', 'gesperrt', 'chiuso'];

function highlightText(text: string): React.ReactNode {
  const regex = new RegExp(`(${HIGHLIGHT_WORDS.join('|')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part)
      ? <span key={i} className="font-bold text-destructive">{part}</span>
      : part
  );
}

// ─── Sport emoji by tag ──────────────────────────────────
function sportEmoji(tag?: string | null): string {
  if (!tag) return '⚽';
  if (tag.includes('basketball') || tag === 'kk_zadar') return '🏀';
  if (tag.includes('handball')) return '🤾';
  return '⚽';
}

// ─── Component ───────────────────────────────────────────
export function WhatIsHappeningToday() {
  const { t } = useLanguage();
  const { data: sports } = useSportsEvents();
  const { data: cityAlerts } = useCityAlertsForFeed();
  const { data: outages } = useTodayOutagesForFeed();
  const hour = getZadarHour();

  const cards: FeedCard[] = useMemo(() => {
    const feed: FeedCard[] = [];

    // ── Sports ────────────────────────────
    if (sports) {
      for (const ev of sports) {
        const now = Date.now();
        const startMs = new Date(ev.start_time).getTime();
        const hoursUntil = (startMs - now) / (1000 * 60 * 60);
        const hoursSince = (now - startMs) / (1000 * 60 * 60);
        const emoji = sportEmoji(ev.team_tag);

        if (ev.match_status === 'live') {
          feed.push({
            id: ev.id,
            priority: 100,
            type: 'live_sport',
            icon: Trophy,
            iconColor: 'text-destructive',
            accentClass: 'border-destructive/40 bg-destructive/5',
            title: `${emoji} ${t('happening.live')}: ${ev.home_team} – ${ev.away_team}`,
            subtitle: `${ev.home_score ?? 0}:${ev.away_score ?? 0}${ev.match_minute ? ` (${ev.match_minute}')` : ''}`,
            badge: t('happening.liveBadge'),
            badgeClass: 'bg-destructive text-white animate-pulse',
            pulsing: true,
          });
        } else if (ev.match_status === 'upcoming' && hoursUntil > 0 && hoursUntil <= 3) {
          feed.push({
            id: ev.id,
            priority: 90,
            type: 'upcoming_sport',
            icon: Trophy,
            iconColor: 'text-[hsl(var(--status-warning))]',
            accentClass: 'border-[hsl(var(--status-warning))]/30 bg-[hsl(var(--status-warning))]/5',
            title: `${emoji} ${t('happening.tonight')}: ${ev.home_team} – ${ev.away_team}`,
            subtitle: `${new Date(ev.start_time).toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' })} · ${t('happening.expectCrowds')}`,
            badge: t('happening.soonBadge'),
            badgeClass: 'bg-[hsl(var(--status-warning))] text-white',
          });
        } else if (ev.match_status === 'finished' && hoursSince <= 2) {
          const homeWon = (ev.home_score ?? 0) > (ev.away_score ?? 0);
          const awayWon = (ev.away_score ?? 0) > (ev.home_score ?? 0);
          const localWin = ev.is_local_team && (homeWon || awayWon);
          feed.push({
            id: ev.id,
            priority: 70,
            type: 'finished_sport',
            icon: Trophy,
            iconColor: 'text-[hsl(var(--status-open))]',
            accentClass: 'border-[hsl(var(--status-open))]/30 bg-[hsl(var(--status-open))]/5',
            title: `${emoji} ${ev.home_team} ${ev.home_score ?? 0}:${ev.away_score ?? 0} ${ev.away_team}`,
            subtitle: localWin ? t('happening.cityAlive') : t('happening.matchEnded'),
            badge: t('happening.finishedBadge'),
            badgeClass: 'bg-[hsl(var(--status-open))] text-white',
          });
        } else if (ev.match_status === 'upcoming' && hoursUntil > 3 && hoursUntil <= 12) {
          feed.push({
            id: ev.id,
            priority: 50,
            type: 'upcoming_sport',
            icon: Trophy,
            iconColor: 'text-muted-foreground',
            accentClass: 'border-border',
            title: `${emoji} ${ev.home_team} – ${ev.away_team}`,
            subtitle: `${t('happening.today')} ${new Date(ev.start_time).toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' })} · ${ev.league || ''}`,
          });
        }
      }
    }

    // ── City alerts (traffic, events, etc.) ────────
    if (cityAlerts) {
      for (const alert of cityAlerts) {
        const typeMap: Record<string, { icon: LucideIcon; color: string }> = {
          traffic: { icon: Car, color: 'text-[hsl(var(--status-warning))]' },
          roads: { icon: Construction, color: 'text-[hsl(var(--status-warning))]' },
          event: { icon: Megaphone, color: 'text-accent' },
          sport: { icon: Trophy, color: 'text-accent' },
          weather: { icon: Wind, color: 'text-destructive' },
          general: { icon: Megaphone, color: 'text-primary' },
        };
        const info = typeMap[alert.type] || typeMap.general;
        const priority = alert.type === 'weather' ? 80 : (alert.type === 'traffic' || alert.type === 'roads') ? 65 : 45;

        feed.push({
          id: `alert-${alert.id}`,
          priority,
          type: alert.type === 'weather' ? 'weather_warning' : alert.type === 'event' ? 'city_event' : 'traffic',
          icon: info.icon,
          iconColor: info.color,
          accentClass: alert.type === 'weather' ? 'border-destructive/30 bg-destructive/5' : 'border-border',
          title: alert.title,
          subtitle: alert.summary,
          link: alert.source_url || undefined,
        });
      }
    }

    // ── Power / water outages ─────────────────────
    if (outages?.power && outages.power.length > 0) {
      feed.push({
        id: 'power-outage-feed',
        priority: 75,
        type: 'traffic',
        icon: Zap,
        iconColor: 'text-destructive',
        accentClass: 'border-destructive/20 bg-destructive/5',
        title: t('alert.powerOutage'),
        subtitle: outages.power.length === 1
          ? `${outages.power[0].area}${outages.power[0].time_from ? ` — ${outages.power[0].time_from} - ${outages.power[0].time_until}` : ''}`
          : t('alert.powerOutageMultiple').replace('{count}', String(outages.power.length)),
        link: 'https://www.hep.hr/ods/bez-struje/19?dp=zadar',
      });
    }
    if (outages?.water && outages.water.length > 0) {
      feed.push({
        id: 'water-outage-feed',
        priority: 72,
        type: 'traffic',
        icon: Droplets,
        iconColor: 'text-blue-500',
        accentClass: 'border-blue-500/20 bg-blue-500/5',
        title: t('alert.waterOutage'),
        subtitle: outages.water.length === 1
          ? `${outages.water[0].area}${outages.water[0].time_from ? ` — ${outages.water[0].time_from} - ${outages.water[0].time_until}` : ''}`
          : t('alert.waterOutageMultiple').replace('{count}', String(outages.water.length)),
        link: 'https://www.vodovod-zadar.hr/obavijesti',
      });
    }

    // ── Fallback: calm status ─────────────────────
    if (feed.length === 0) {
      const isAfternoon = hour >= 14 && hour < 18;
      const isEvening = hour >= 18;
      const isWeekend = [0, 6].includes(new Date().getDay());

      let fallbackTitle = t('happening.calmDay');
      if (isAfternoon) fallbackTitle = t('happening.calmAfternoon');
      else if (isEvening) fallbackTitle = t('happening.calmEvening');
      if (isWeekend && !isEvening) fallbackTitle = t('happening.livelyWeekend');

      feed.push({
        id: 'fallback-calm',
        priority: 0,
        type: 'fallback',
        icon: Coffee,
        iconColor: 'text-muted-foreground',
        accentClass: 'border-border',
        title: fallbackTitle,
        subtitle: t('happening.nothingMajor'),
      });
    }

    // Sort by priority descending
    feed.sort((a, b) => b.priority - a.priority);
    return feed;
  }, [sports, cityAlerts, outages, hour, t]);

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="h-4 w-4 text-accent" />
        <h2 className="text-sm font-semibold text-foreground">{t('happening.sectionTitle')}</h2>
      </div>

      <div className="flex flex-col gap-2.5">
        <AnimatePresence mode="popLayout">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
                className={`rounded-xl border p-3.5 ${card.accentClass} ${card.link ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} ${card.pulsing ? 'ring-1 ring-destructive/30' : ''}`}
                onClick={() => card.link && window.open(card.link, '_blank', 'noopener,noreferrer')}
              >
                <div className="flex items-start gap-2.5">
                  <Icon className={`h-4.5 w-4.5 mt-0.5 flex-shrink-0 ${card.iconColor}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-xs font-semibold text-foreground leading-snug flex-1">
                        {card.title}
                      </p>
                      {card.badge && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${card.badgeClass}`}>
                          {card.badge}
                        </span>
                      )}
                      {card.link && (
                        <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {typeof card.subtitle === 'string' ? highlightText(card.subtitle) : card.subtitle}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </section>
  );
}
