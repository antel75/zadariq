import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type BusinessHoursOverride = {
  id: string;
  business_id: string;
  day_of_week: number;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
  notes: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

const DAY_NAMES = ['Ned', 'Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub'];

export function getDayName(dayIndex: number): string {
  return DAY_NAMES[dayIndex] || '?';
}

export function useBusinessHoursOverrides() {
  const [overrides, setOverrides] = useState<BusinessHoursOverride[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOverrides = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('business_hours_overrides')
      .select('*')
      .order('business_id')
      .order('day_of_week');
    if (data) setOverrides(data as unknown as BusinessHoursOverride[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchOverrides();
  }, []);

  const saveOverride = async (override: Partial<BusinessHoursOverride>) => {
    if (!override.business_id || override.day_of_week === undefined) return false;
    
    const record = {
      business_id: override.business_id,
      day_of_week: override.day_of_week,
      open_time: override.is_closed ? null : (override.open_time || null),
      close_time: override.is_closed ? null : (override.close_time || null),
      is_closed: override.is_closed ?? false,
      notes: override.notes || null,
    };

    if (override.id) {
      const { error } = await supabase
        .from('business_hours_overrides')
        .update(record)
        .eq('id', override.id);
      if (error) return false;
    } else {
      const { error } = await supabase
        .from('business_hours_overrides')
        .upsert(record, { onConflict: 'business_id,day_of_week' });
      if (error) return false;
    }
    await fetchOverrides();
    return true;
  };

  const deleteOverride = async (id: string) => {
    await supabase.from('business_hours_overrides').delete().eq('id', id);
    await fetchOverrides();
  };

  const getOverridesForBusiness = (businessId: string) => {
    return overrides.filter(o => o.business_id === businessId);
  };

  return { overrides, loading, saveOverride, deleteOverride, getOverridesForBusiness, refetch: fetchOverrides };
}
