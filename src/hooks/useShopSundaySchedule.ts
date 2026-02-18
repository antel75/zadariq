import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type SundayEntry = {
  id: string;
  business_id: string;
  sunday_date: string;
  open_time: string | null;
  close_time: string | null;
  notes: string | null;
};

export function useShopSundaySchedule() {
  return useQuery({
    queryKey: ['shop-sunday-schedule'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('shop_sunday_schedule')
        .select('*')
        .gte('sunday_date', today)
        .order('sunday_date')
        .limit(200);
      return (data as unknown as SundayEntry[]) || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function getNextSunday(entries: SundayEntry[], businessId: string): SundayEntry | null {
  return entries.find(e => e.business_id === businessId) || null;
}
