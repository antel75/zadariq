import { useMemo } from 'react';
import { useWeather } from '@/hooks/useWeather';
import { useSmartFerry } from '@/hooks/useTransportSchedules';
import { getZadarHour } from '@/hooks/useSituationalMode';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ── Zone definitions ──

export type ZoneId = 'poluotok' | 'riva' | 'borik' | 'visnjik' | 'gazenica';

export type PulseLevel = 'quiet' | 'light' | 'pleasant' | 'lively' | 'peak';

export interface ZoneConfig {
  id: ZoneId;
  nameKey: string;
  /** Hour-based modifiers: [morning, day, evening, night] */
  timeModifiers: [number, number, number, number];
  /** Extra score for ferry arrivals */
  ferryBonus: number;
}

export interface ZonePulse {
  zone: ZoneConfig;
  score: number;
  level: PulseLevel;
  emoji: string;
  labelKey: string;
  descriptionKey: string;
}

export interface CityPulseResult {
  zones: ZonePulse[];
  loading: boolean;
  /** Global recommendation key based on overall pulse */
  recommendationKey: string | null;
  isRaining: boolean;
}

const ZONES: ZoneConfig[] = [
  { id: 'poluotok', nameKey: 'pulse.zone.poluotok', timeModifiers: [5, 10, 20, 25], ferryBonus: 5 },
  { id: 'riva', nameKey: 'pulse.zone.riva', timeModifiers: [0, 15, 25, 20], ferryBonus: 10 },
  { id: 'borik', nameKey: 'pulse.zone.borik', timeModifiers: [5, 20, 15, 0], ferryBonus: 0 },
  { id: 'visnjik', nameKey: 'pulse.zone.visnjik', timeModifiers: [10, 15, 10, -5], ferryBonus: 0 },
  { id: 'gazenica', nameKey: 'pulse.zone.gazenica', timeModifiers: [5, 5, 5, -10], ferryBonus: 15 },
];

// ── Score helpers ──

function getWeatherScore(weatherCode: number, tempC: number, windKmh: number): number {
  let s = 0;
  // Rain
  if (weatherCode >= 51 && weatherCode <= 67) s -= 25;
  else if (weatherCode >= 80) s -= 25;
  // Bura
  if (windKmh >= 40) s -= 20;
  // Cold
  if (tempC < 7) s -= 10;
  // Ideal temp
  if (tempC >= 18 && tempC <= 26) s += 15;
  // Sunny
  if (weatherCode <= 1) s += 10;
  return s;
}

function getTimeOfDayIndex(hour: number): number {
  if (hour >= 5 && hour < 10) return 0;  // morning
  if (hour >= 10 && hour < 17) return 1; // day
  if (hour >= 17 && hour < 22) return 2; // evening
  return 3; // night
}

function getBaseTimeScore(hour: number): number {
  if (hour >= 5 && hour < 10) return 10;
  if (hour >= 10 && hour < 17) return 15;
  if (hour >= 17 && hour < 22) return 25;
  if (hour >= 22 || hour < 2) return 30;
  return -20; // 02-05
}

function getDayOfWeekScore(): number {
  const day = new Date().getDay(); // 0=Sun
  if (day === 5 || day === 6) return 20; // Fri/Sat
  if (day === 0) return 10; // Sun
  return 0;
}

function getSeasonScore(): number {
  const month = new Date().getMonth() + 1;
  if (month >= 6 && month <= 9) return 25;
  if (month === 5 || month === 10) return 10;
  return 0;
}

function getCommunityScore(votes: { vote_level: string }[]): number {
  if (!votes.length) return 0;
  let total = 0;
  const uniqueFingerprints = new Set<string>();
  for (const v of votes) {
    if (v.vote_level === 'quiet') total += 0;
    else if (v.vote_level === 'moderate') total += 3;
    else if (v.vote_level === 'lively') total += 5;
  }
  return Math.min(total, 25);
}

function scoreToLevel(score: number): { level: PulseLevel; emoji: string; labelKey: string } {
  const clamped = Math.max(0, Math.min(100, score));
  if (clamped <= 15) return { level: 'quiet', emoji: '🌙', labelKey: 'pulse.level.quiet' };
  if (clamped <= 35) return { level: 'light', emoji: '🟢', labelKey: 'pulse.level.light' };
  if (clamped <= 55) return { level: 'pleasant', emoji: '🟡', labelKey: 'pulse.level.pleasant' };
  if (clamped <= 75) return { level: 'lively', emoji: '🟠', labelKey: 'pulse.level.lively' };
  return { level: 'peak', emoji: '🔴', labelKey: 'pulse.level.peak' };
}

function getDescriptionKey(level: PulseLevel, timeIdx: number): string {
  const map: Record<PulseLevel, string[]> = {
    quiet: ['pulse.desc.quietMorning', 'pulse.desc.quietDay', 'pulse.desc.quietEvening', 'pulse.desc.quietNight'],
    light: ['pulse.desc.lightMorning', 'pulse.desc.lightDay', 'pulse.desc.lightEvening', 'pulse.desc.lightNight'],
    pleasant: ['pulse.desc.pleasantMorning', 'pulse.desc.pleasantDay', 'pulse.desc.pleasantEvening', 'pulse.desc.pleasantNight'],
    lively: ['pulse.desc.livelyMorning', 'pulse.desc.livelyDay', 'pulse.desc.livelyEvening', 'pulse.desc.livelyNight'],
    peak: ['pulse.desc.peakMorning', 'pulse.desc.peakDay', 'pulse.desc.peakEvening', 'pulse.desc.peakNight'],
  };
  return map[level][timeIdx];
}

// ── Hook ──

export function useCityPulse(): CityPulseResult {
  const { data: weather, loading: weatherLoading } = useWeather();
  const { ferry } = useSmartFerry();
  const hour = getZadarHour();

  // Fetch recent community votes (last 2 hours)
  const { data: votes } = useQuery({
    queryKey: ['city-pulse-votes'],
    queryFn: async () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from('city_pulse_votes')
        .select('zone_id, vote_level')
        .gte('created_at', twoHoursAgo);
      return data ?? [];
    },
    refetchInterval: 5 * 60 * 1000, // refetch every 5 min
  });

  const isRaining = weather ? (weather.weatherCode >= 51 && weather.weatherCode <= 67) || weather.weatherCode >= 80 : false;

  const zones = useMemo(() => {
    const weatherScore = weather ? getWeatherScore(weather.weatherCode, weather.tempC, weather.windKmh) : 0;
    const baseTime = getBaseTimeScore(hour);
    const dayScore = getDayOfWeekScore();
    const seasonScore = getSeasonScore();
    const timeIdx = getTimeOfDayIndex(hour);
    
    // Ferry arrival bonus: if next departure within 60 min
    const ferryIncoming = !!ferry;

    return ZONES.map(zone => {
      const zoneVotes = (votes ?? []).filter(v => v.zone_id === zone.id);
      const communityScore = getCommunityScore(zoneVotes);
      
      let score = baseTime + weatherScore + dayScore + seasonScore + zone.timeModifiers[timeIdx] + communityScore;
      if (ferryIncoming) score += zone.ferryBonus;
      
      score = Math.max(0, Math.min(100, score));
      
      const { level, emoji, labelKey } = scoreToLevel(score);
      const descriptionKey = getDescriptionKey(level, timeIdx);

      return { zone, score, level, emoji, labelKey, descriptionKey } as ZonePulse;
    });
  }, [weather, hour, ferry, votes]);

  // Global recommendation
  const recommendationKey = useMemo(() => {
    if (!zones.length) return null;
    const hasPeak = zones.some(z => z.level === 'peak');
    const allQuiet = zones.every(z => z.level === 'quiet' || z.level === 'light');
    
    if (hasPeak) return 'pulse.rec.peakTonight';
    if (allQuiet) return 'pulse.rec.quietWalk';
    if (isRaining) return 'pulse.rec.rainy';
    return null;
  }, [zones, isRaining]);

  return { zones, loading: weatherLoading, recommendationKey, isRaining };
}
