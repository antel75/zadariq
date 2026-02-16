import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SmokingStatusBadge } from '@/components/SmokingStatusBadge';
import type { SmokingStatus } from '@/hooks/useCafeSmokingStatus';

interface SmokingStatusInlineProps {
  businessId: string;
}

export function SmokingStatusInline({ businessId }: SmokingStatusInlineProps) {
  const [status, setStatus] = useState<SmokingStatus>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000).toISOString();
      const { data: reports } = await supabase
        .from('cafe_smoking_reports')
        .select('report_value')
        .eq('business_id', businessId)
        .gte('created_at', ninetyDaysAgo);

      if (!reports || reports.length < 3) {
        setStatus(null);
        setLoaded(true);
        return;
      }

      const counts: Record<string, number> = { allowed: 0, partial: 0, not_allowed: 0 };
      for (const r of reports) {
        counts[r.report_value] = (counts[r.report_value] || 0) + 1;
      }

      const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      setStatus(entries[0][0] as SmokingStatus);
      setLoaded(true);
    };

    fetchStatus();
  }, [businessId]);

  if (!loaded) return null;

  return <SmokingStatusBadge status={status} size="sm" />;
}
