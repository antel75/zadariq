import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type AppMode = 'normal' | 'pre_match' | 'live_match' | 'post_match';

export interface MatchEvent {
  id: string;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  match_status: string;
  match_minute: string | null;
  start_time: string;
  league: string | null;
  venue: string | null;
  sport: string;
  team_tag: string | null;
}

export interface AppModeState {
  mode: AppMode;
  match: MatchEvent | null;
}

function detectAppMode(events: MatchEvent[]): AppModeState {
  const now = Date.now();

  // Priority 1: LIVE local match
  const live = events.find(
    e => e.match_status === 'live'
  );
  if (live) return { mode: 'live_match', match: live };

  // Priority 2: POST match (finished < 20 min ago)
  // We approximate "finished time" as updated_at or start_time + 2h
  const finished = events.find(e => {
    if (e.match_status !== 'finished') return false;
    // Use start_time + ~2h as proxy for end time
    const estimatedEnd = new Date(e.start_time).getTime() + 2 * 60 * 60 * 1000;
    const timeSinceEnd = (now - estimatedEnd) / (1000 * 60);
    // Also check if start_time was within last 4 hours (match could have ended recently)
    const hoursSinceStart = (now - new Date(e.start_time).getTime()) / (1000 * 60 * 60);
    return timeSinceEnd <= 20 || (hoursSinceStart <= 4 && hoursSinceStart >= 1.2);
  });
  if (finished) return { mode: 'post_match', match: finished };

  // Priority 3: PRE match (upcoming within 90 minutes)
  const upcoming = events.find(e => {
    if (e.match_status !== 'upcoming') return false;
    const minutesUntil = (new Date(e.start_time).getTime() - now) / (1000 * 60);
    return minutesUntil > 0 && minutesUntil <= 90;
  });
  if (upcoming) return { mode: 'pre_match', match: upcoming };

  return { mode: 'normal', match: null };
}

export function useAppMode(): AppModeState {
  const { data } = useQuery({
    queryKey: ['app-mode-sports'],
    queryFn: async () => {
      const now = new Date();
      const past4h = new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString();
      const next2h = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from('sports_events')
        .select('*')
        .eq('is_local_team', true)
        .gte('start_time', past4h)
        .lte('start_time', next2h)
        .order('start_time', { ascending: true });
      return (data || []) as MatchEvent[];
    },
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
  });

  return detectAppMode(data || []);
}
