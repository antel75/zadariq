import { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getZadarHour } from '@/hooks/useSituationalMode';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, AlertTriangle, Car, Construction, Ship, Megaphone,
  Coffee, ExternalLink, Zap, Droplets, Wind, WifiOff, Flag
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────
interface FeedCard {
  id: string;
  priority: number;
  type: 'live_sport' | 'upcoming_sport' | 'finished_sport' | 'weather_warning' | 'traffic' | 'city_event' | 'fallback';
  icon: LucideIcon;
  iconColor: string;
  accentClass: string;
  title: string;
  subtitle: string;
  badge?: string;
  badgeClass?: string;
  link?: string;
  pulsing?: boolean;
  debugInfo?: string;
  sourceMeta?: string;
}

// ─── Hooks ───────────────────────────────────────────────
function useSportsEvents() {
  return useQuery({
    queryKey: ['sports-events-feed'],
    queryFn: async () => {
      const now = new Date().toISOString();

      // 1) Live matches (never stale)
      const { data: live } = await supabase
        .from('sports_events')
        .select('*')
        .eq('match_status', 'live')
        .order('start_time', { ascending: true });
      
      // 2) Today matches (next 24h, non-stale)
      const next24h = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const { data: today } = await supabase
        .from('sports_events')
        .select('*')
        .eq('match_status', 'upcoming')
        .eq('is_stale', false)
        .gte('start_time', now)
        .lte('start_time', next24h)
        .order('start_time', { ascending: true });

      // 3) Next upcoming (non-stale)
      const { data: upcoming } = await supabase
        .from('sports_events')
        .select('*')
        .eq('match_status', 'upcoming')
        .eq('is_stale', false)
        .gte('start_time', now)
        .order('start_time', { ascending: true })
        .limit(6);

      // 4) Last results (non-stale, within 7 days)
      const { data: last } = await supabase
        .from('sports_events')
        .select('*')
        .eq('match_status', 'finished')
        .eq('is_stale', false)
        .order('start_time', { ascending: false })
        .limit(3);

      return {
        live: live || [],
        today: today || [],
        upcoming: upcoming || [],
        last: last || [],
      };
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

function useSportsFetchStatus() {
  return useQuery({
    queryKey: ['sports-fetch-status'],
    queryFn: async () => {
      const { data } = await supabase
        .from('sports_fetch_status')
        .select('*')
        .eq('id', 'fetch-sports')
        .maybeSingle();
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

function useSportsSourcesHealth() {
  return useQuery({
    queryKey: ['sports-sources-health'],
    queryFn: async () => {
      const { data } = await supabase
        .from('sports_sources_health')
        .select('*');
      return data || [];
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
  if (tag === 'f1') return '🏎️';
  if (tag.includes('basketball') || tag === 'kk_zadar') return '🏀';
  if (tag.includes('handball')) return '🤾';
  if (tag === 'ucl') return '⚽🏆';
  if (tag === 'croatia_nt') return '🇭🇷⚽';
  return '⚽';
}

// ─── Component ───────────────────────────────────────────
export function WhatIsHappeningToday() {
  const { t } = useLanguage();
  const { data: sportsData } = useSportsEvents();
  const { data: cityAlerts } = useCityAlertsForFeed();
  const { data: outages } = useTodayOutagesForFeed();
  const { data: fetchStatus } = useSportsFetchStatus();
  const { data: sourcesHealth } = useSportsSourcesHealth();
  const hour = getZadarHour();
  const apiDown = fetchStatus && fetchStatus.ok === false;
  const isDebug = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debug');

  const cards: FeedCard[] = useMemo(() => {
    const feed: FeedCard[] = [];
    const now = Date.now();

    // ── Sports: always show something ────────────────
    if (sportsData) {
      const { live, today, upcoming, last } = sportsData;
      const hasAnySport = live.length > 0 || today.length > 0 || upcoming.length > 0 || last.length > 0;

      // LIVE
      for (const ev of live) {
        const emoji = sportEmoji(ev.team_tag);
        const fetchedTime = ev.fetched_at ? new Date(ev.fetched_at).toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' }) : '';
        feed.push({
          id: ev.id,
          priority: 120,
          type: 'live_sport',
          icon: Trophy,
          iconColor: 'text-destructive',
          accentClass: 'border-destructive/40 bg-destructive/5',
          title: `${emoji} ${t('happening.liveMatch')}: ${ev.home_team} – ${ev.away_team}`,
          subtitle: `${ev.home_score ?? 0}:${ev.away_score ?? 0}${ev.match_minute ? ` (${ev.match_minute})` : ''}`,
          badge: t('happening.liveBadge'),
          badgeClass: 'bg-destructive text-white animate-pulse',
          pulsing: true,
          link: ev.link_url || ev.source_url || undefined,
          sourceMeta: fetchedTime ? `${ev.source === 'api' ? 'TheSportsDB' : ev.source} · ${fetchedTime}` : undefined,
          debugInfo: `id:${ev.id} api:${ev.api_match_id} tag:${ev.team_tag} status:${ev.match_status} stale:${ev.is_stale} conf:${ev.confidence}`,
        });
      }

      // TODAY (within 24h)
      for (const ev of today) {
        if (live.some((l: any) => l.id === ev.id)) continue;
        const emoji = sportEmoji(ev.team_tag);
        const isF1 = ev.team_tag === 'f1';
        const label = isF1 ? t('happening.nextRace') : t('happening.todayPlays');
        const hoursUntil = (new Date(ev.start_time).getTime() - now) / 3600000;
        const priority = hoursUntil < 3 ? 100 : 90;
        const fetchedTime = ev.fetched_at ? new Date(ev.fetched_at).toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' }) : '';
        
        feed.push({
          id: ev.id,
          priority,
          type: 'upcoming_sport',
          icon: isF1 ? Flag : Trophy,
          iconColor: 'text-[hsl(var(--status-warning))]',
          accentClass: 'border-[hsl(var(--status-warning))]/30 bg-[hsl(var(--status-warning))]/5',
          title: `${emoji} ${label}: ${isF1 ? ev.away_team : `${ev.home_team} – ${ev.away_team}`}`,
          subtitle: `${new Date(ev.start_time).toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' })} · ${ev.league || ''}${ev.venue ? ` · ${ev.venue}` : ''}`,
          badge: t('happening.soonBadge'),
          badgeClass: 'bg-[hsl(var(--status-warning))] text-white',
          link: ev.link_url || ev.source_url || undefined,
          sourceMeta: fetchedTime ? `${ev.source === 'api' ? 'TheSportsDB' : ev.source} · ${fetchedTime}` : undefined,
          debugInfo: `id:${ev.id} api:${ev.api_match_id} tag:${ev.team_tag} start:${ev.start_time} stale:${ev.is_stale}`,
        });
      }

      // UPCOMING (not today but next ones)
      for (const ev of upcoming) {
        if (today.some((td: any) => td.id === ev.id)) continue;
        if (feed.some(f => f.id === ev.id)) continue;
        const emoji = sportEmoji(ev.team_tag);
        const isF1 = ev.team_tag === 'f1';
        const date = new Date(ev.start_time);
        const dayStr = date.toLocaleDateString('hr-HR', { weekday: 'short', day: 'numeric', month: 'short' });
        const timeStr = date.toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' });
        const label = isF1 ? t('happening.nextRace') : t('happening.nextMatch');
        const hoursUntil = (date.getTime() - now) / 3600000;
        const priority = isF1 && hoursUntil < 72 ? 85 : 40;

        feed.push({
          id: ev.id,
          priority,
          type: 'upcoming_sport',
          icon: isF1 ? Flag : Trophy,
          iconColor: 'text-muted-foreground',
          accentClass: 'border-border',
          title: `${emoji} ${label}: ${isF1 ? ev.away_team : `${ev.home_team} – ${ev.away_team}`}`,
          subtitle: `${dayStr} ${timeStr} · ${ev.league || ''}`,
          link: ev.link_url || ev.source_url || undefined,
          debugInfo: `id:${ev.id} api:${ev.api_match_id} tag:${ev.team_tag} start:${ev.start_time}`,
        });
      }

      // LAST RESULTS (show at least 1)
      const shownSportIds = new Set(feed.map(f => f.id));
      for (const ev of last) {
        if (shownSportIds.has(ev.id)) continue;
        const emoji = sportEmoji(ev.team_tag);
        const isF1 = ev.team_tag === 'f1';
        const label = isF1 ? t('happening.lastRace') : t('happening.lastResult');
        const fetchedTime = ev.fetched_at ? new Date(ev.fetched_at).toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' }) : '';

        feed.push({
          id: ev.id,
          priority: 30,
          type: 'finished_sport',
          icon: isF1 ? Flag : Trophy,
          iconColor: 'text-[hsl(var(--status-open))]',
          accentClass: 'border-[hsl(var(--status-open))]/30 bg-[hsl(var(--status-open))]/5',
          title: `${emoji} ${label}: ${isF1 ? ev.away_team : `${ev.home_team} ${ev.home_score ?? 0}:${ev.away_score ?? 0} ${ev.away_team}`}`,
          subtitle: isF1 && ev.match_minute
            ? ev.match_minute
            : new Date(ev.start_time).toLocaleDateString('hr-HR', { weekday: 'short', day: 'numeric', month: 'short' }),
          badge: t('happening.finishedBadge'),
          badgeClass: 'bg-[hsl(var(--status-open))] text-white',
          link: ev.link_url || ev.source_url || undefined,
          sourceMeta: fetchedTime ? `${ev.source === 'api' ? 'TheSportsDB' : ev.source} · ${fetchedTime}` : undefined,
          debugInfo: `id:${ev.id} api:${ev.api_match_id} tag:${ev.team_tag} date:${ev.start_time} stale:${ev.is_stale} conf:${ev.confidence}`,
        });
      }

      // If absolutely no sports data
      if (!hasAnySport) {
        if (apiDown) {
          feed.push({
            id: 'api-down',
            priority: 15,
            type: 'fallback',
            icon: WifiOff,
            iconColor: 'text-muted-foreground',
            accentClass: 'border-[hsl(var(--status-warning))]/20 bg-[hsl(var(--status-warning))]/5',
            title: `⚽ ${t('sports.noFreshData')}`,
            subtitle: t('sports.openExternal'),
            link: 'https://www.sofascore.com/',
          });
        } else {
          feed.push({
            id: 'no-sports',
            priority: 10,
            type: 'fallback',
            icon: Trophy,
            iconColor: 'text-muted-foreground',
            accentClass: 'border-border',
            title: t('sports.noFreshData'),
            subtitle: t('sports.openExternal'),
            link: 'https://www.sofascore.com/',
          });
        }
      }
    }

    // API warning banner
    if (apiDown && sportsData && (sportsData.live.length > 0 || sportsData.today.length > 0 || sportsData.upcoming.length > 0 || sportsData.last.length > 0)) {
      feed.push({
        id: 'api-status-warning',
        priority: 5,
        type: 'fallback',
        icon: WifiOff,
        iconColor: 'text-muted-foreground',
        accentClass: 'border-[hsl(var(--status-warning))]/20 bg-[hsl(var(--status-warning))]/5',
        title: t('happening.autoUpdateDown'),
        subtitle: t('happening.apiUnavailable'),
      });
    }

    // ── City alerts ────────
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

    feed.sort((a, b) => b.priority - a.priority);
    return feed;
  }, [sportsData, cityAlerts, outages, hour, t, apiDown]);

  // Get last update time from sources health
  const lastUpdate = useMemo(() => {
    if (!sourcesHealth || sourcesHealth.length === 0) return null;
    const latest = sourcesHealth
      .filter((s: any) => s.last_success_at)
      .sort((a: any, b: any) => new Date(b.last_success_at).getTime() - new Date(a.last_success_at).getTime());
    if (latest.length === 0) return null;
    return new Date(latest[0].last_success_at).toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' });
  }, [sourcesHealth]);

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="h-4 w-4 text-accent" />
        <h2 className="text-sm font-semibold text-foreground">{t('happening.sectionTitle')}</h2>
        {lastUpdate && (
          <span className="text-[10px] text-muted-foreground ml-auto">
            {t('happening.updated')}: {lastUpdate}
          </span>
        )}
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
                    {card.sourceMeta && (
                      <p className="text-[9px] text-muted-foreground/60 mt-0.5">{card.sourceMeta}</p>
                    )}
                    {isDebug && card.debugInfo && (
                      <p className="text-[8px] text-muted-foreground/40 mt-0.5 font-mono break-all">{card.debugInfo}</p>
                    )}
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
