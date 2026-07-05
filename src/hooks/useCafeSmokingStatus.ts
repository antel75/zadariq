import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type SmokingStatus = 'allowed' | 'partial' | 'not_allowed' | null;

export interface SmokingData {
  status: SmokingStatus;
  confidence: number; // 0-100
  updatedAt: string | null;
  totalReports: number;
}

function getFingerprint(): string {
  const nav = navigator;
  const raw = [
    nav.userAgent,
    nav.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    nav.hardwareConcurrency || 0,
  ].join('|');
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'fp_' + Math.abs(hash).toString(36);
}

export function useCafeSmokingStatus(businessId: string) {
  const [data, setData] = useState<SmokingData>({ status: null, confidence: 0, updatedAt: null, totalReports: 0 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [cooldown, setCooldown] = useState(false);

  const fetchStatus = useCallback(async () => {
    // Get reports from last 90 days
    const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000).toISOString();
    const { data: reports } = await supabase
      .from('cafe_smoking_reports')
      .select('report_value, created_at')
      .eq('business_id', businessId)
      .gte('created_at', ninetyDaysAgo);

    if (!reports || reports.length === 0) {
      setData({ status: null, confidence: 0, updatedAt: null, totalReports: 0 });
      setLoading(false);
      return;
    }

    const counts: Record<string, number> = { allowed: 0, partial: 0, not_allowed: 0 };
    let latestDate: string | null = null;

    for (const r of reports) {
      counts[r.report_value] = (counts[r.report_value] || 0) + 1;
      if (!latestDate || r.created_at > latestDate) latestDate = r.created_at;
    }

    const total = reports.length;
    
    if (total < 3) {
      setData({ status: null, confidence: 0, updatedAt: latestDate, totalReports: total });
      setLoading(false);
      return;
    }

    // Find majority status
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const majorityStatus = entries[0][0] as SmokingStatus;
    const confidence = Math.min(100, total * 25);

    setData({ status: majorityStatus, confidence, updatedAt: latestDate, totalReports: total });
    setLoading(false);
  }, [businessId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const submitReport = async (value: 'allowed' | 'partial' | 'not_allowed') => {
    if (submitting || cooldown) return;
    setSubmitting(true);

    const fingerprint = getFingerprint();

    // Cooldown + rate-limit checked server-side (RPC hides fingerprint_hash from public reads)
    const { data: guard } = await supabase.rpc('check_cafe_smoking_cooldown', {
      p_business_id: businessId,
      p_fingerprint: fingerprint,
    });
    const g = (guard as { business_cooldown?: boolean; rate_limited?: boolean } | null) || {};
    if (g.business_cooldown || g.rate_limited) {
      setCooldown(true);
      setSubmitting(false);
      return;
    }

    await supabase.from('cafe_smoking_reports').insert({
      business_id: businessId,
      fingerprint_hash: fingerprint,
      report_value: value,
    });

    setSubmitted(true);
    setSubmitting(false);
    fetchStatus();
  };

  return { data, loading, submitReport, submitting, submitted, cooldown };
}
