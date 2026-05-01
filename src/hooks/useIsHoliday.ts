import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Returns true if today (Europe/Zagreb) is a Croatian public holiday.
 * Used to mark parking as free, treat transport as Sunday, etc.
 */
export function useIsHoliday() {
  return useQuery({
    queryKey: ['is-holiday-today'],
    queryFn: async () => {
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const { data } = await supabase
        .from('public_holidays')
        .select('holiday_date, name')
        .eq('holiday_date', todayStr)
        .maybeSingle();
      return { isHoliday: !!data, name: data?.name as string | undefined };
    },
    staleTime: 60 * 60 * 1000, // 1h
  });
}