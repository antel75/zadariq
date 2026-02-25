import { useMemo } from 'react';
import { useWeather } from '@/hooks/useWeather';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getZadarHour } from '@/hooks/useSituationalMode';

// ── Types ──

export type OutdoorSeverity = 'good' | 'ok' | 'bad' | 'danger';

export interface OutdoorRecommendation {
  labelKey: string;
  reasonKey: string;
  severity: OutdoorSeverity;
  iconName: 'leaf' | 'sun' | 'cloud-rain' | 'wind' | 'alert-triangle';
  action?: { type: 'open_url' | 'navigate'; value: string };
  fetchedAt: number | null;
  debug?: {
    windKmh: number;
    windGustKmh: number;
    precipMm: number;
    precipProb: number;
    weatherCode: number;
    meteoAlertLevel: string | null;
  };
}

// ── Meteo alerts hook (shared query key) ──

function useMeteoAlerts() {
  return useQuery({
    queryKey: ['meteoalarm-zadar'],
    queryFn: async () => {
      const res = await supabase.functions.invoke('meteoalarm');
      if (res.error) throw res.error;
      return (res.data?.alerts || []) as Array<{
        title: string;
        level: string;
        levelNum: number;
        type: string;
        description: string;
      }>;
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

// ── Core logic ──

export function getOutdoorRecommendation(
  weather: {
    weatherCode: number;
    tempC: number;
    windKmh: number;
    windGustKmh: number;
    precipitationMm: number;
    precipitationProbability: number;
    fetchedAt: number;
  } | null,
  meteoAlerts: Array<{ level: string; levelNum: number }> | null | undefined,
  hour: number
): OutdoorRecommendation {
  const fetchedAt = weather?.fetchedAt ?? null;

  // Anti-sramota: if no data, show neutral
  if (!weather) {
    return {
      labelKey: 'outdoor.label.noData',
      reasonKey: 'outdoor.reason.noData',
      severity: 'ok',
      iconName: 'cloud-rain',
      fetchedAt: null,
    };
  }

  const { weatherCode, tempC, windKmh, windGustKmh, precipitationMm, precipitationProbability } = weather;

  const topAlert = meteoAlerts && meteoAlerts.length > 0 ? meteoAlerts[0] : null;
  const alertLevel = topAlert?.level ?? null;
  const isOrangeRed = alertLevel === 'orange' || alertLevel === 'red';

  const debug = {
    windKmh,
    windGustKmh,
    precipMm: precipitationMm,
    precipProb: precipitationProbability,
    weatherCode,
    meteoAlertLevel: alertLevel,
  };

  // ── A) DANGER ──
  if (isOrangeRed) {
    return {
      labelKey: 'outdoor.label.danger',
      reasonKey: 'outdoor.reason.meteoAlert',
      severity: 'danger',
      iconName: 'alert-triangle',
      action: { type: 'open_url', value: 'https://meteoalarm.org/en/live/' },
      fetchedAt,
      debug,
    };
  }

  if (precipitationMm >= 0.5) {
    return {
      labelKey: 'outdoor.label.danger',
      reasonKey: 'outdoor.reason.rain',
      severity: 'danger',
      iconName: 'cloud-rain',
      action: { type: 'open_url', value: 'https://www.windy.com/44.12/15.23' },
      fetchedAt,
      debug,
    };
  }

  if (windGustKmh >= 60 || windKmh >= 45) {
    return {
      labelKey: 'outdoor.label.danger',
      reasonKey: 'outdoor.reason.strongWind',
      severity: 'danger',
      iconName: 'wind',
      action: { type: 'open_url', value: 'https://www.windy.com/44.12/15.23' },
      fetchedAt,
      debug,
    };
  }

  if (weatherCode >= 80) {
    return {
      labelKey: 'outdoor.label.danger',
      reasonKey: 'outdoor.reason.storm',
      severity: 'danger',
      iconName: 'cloud-rain',
      action: { type: 'open_url', value: 'https://www.windy.com/44.12/15.23' },
      fetchedAt,
      debug,
    };
  }

  // ── B) BAD ──
  if (precipitationProbability >= 70 || precipitationMm >= 0.3) {
    return {
      labelKey: 'outdoor.label.bad',
      reasonKey: precipitationMm > 0 ? 'outdoor.reason.lightRain' : 'outdoor.reason.rainLikely',
      severity: 'bad',
      iconName: 'cloud-rain',
      action: { type: 'open_url', value: 'https://www.windy.com/44.12/15.23' },
      fetchedAt,
      debug,
    };
  }

  if (windGustKmh >= 45 || windKmh >= 30) {
    return {
      labelKey: 'outdoor.label.bad',
      reasonKey: 'outdoor.reason.windy',
      severity: 'bad',
      iconName: 'wind',
      fetchedAt,
      debug,
    };
  }

  if (tempC <= 3) {
    return {
      labelKey: 'outdoor.label.bad',
      reasonKey: 'outdoor.reason.veryCold',
      severity: 'bad',
      iconName: 'cloud-rain',
      fetchedAt,
      debug,
    };
  }

  // Yellow meteoalert → bad
  if (alertLevel === 'yellow') {
    return {
      labelKey: 'outdoor.label.bad',
      reasonKey: 'outdoor.reason.meteoYellow',
      severity: 'bad',
      iconName: 'alert-triangle',
      action: { type: 'open_url', value: 'https://meteoalarm.org/en/live/' },
      fetchedAt,
      debug,
    };
  }

  // ── C) OK ──
  if (tempC >= 4 && tempC <= 10 && precipitationMm === 0 && windKmh < 20) {
    return {
      labelKey: 'outdoor.label.ok',
      reasonKey: 'outdoor.reason.coolJacket',
      severity: 'ok',
      iconName: 'sun',
      fetchedAt,
      debug,
    };
  }

  if (precipitationProbability >= 30) {
    return {
      labelKey: 'outdoor.label.ok',
      reasonKey: 'outdoor.reason.maybeRain',
      severity: 'ok',
      iconName: 'cloud-rain',
      fetchedAt,
      debug,
    };
  }

  // ── D) GOOD ──
  if (precipitationProbability < 30 && precipitationMm === 0 && windKmh < 20) {
    return {
      labelKey: 'outdoor.label.good',
      reasonKey: 'outdoor.reason.stable',
      severity: 'good',
      iconName: 'leaf',
      fetchedAt,
      debug,
    };
  }

  // Fallback: OK/neutral
  return {
    labelKey: 'outdoor.label.ok',
    reasonKey: 'outdoor.reason.neutral',
    severity: 'ok',
    iconName: 'sun',
    fetchedAt,
    debug,
  };
}

// ── Hook ──

export function useOutdoorRecommendation(): OutdoorRecommendation {
  const { data: weather } = useWeather();
  const { data: meteoAlerts } = useMeteoAlerts();
  const hour = getZadarHour();

  return useMemo(
    () => getOutdoorRecommendation(weather, meteoAlerts, hour),
    [weather, meteoAlerts, hour]
  );
}
