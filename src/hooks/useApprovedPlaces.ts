import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Business } from '@/data/types';

export function useApprovedPlaces() {
  return useQuery({
    queryKey: ['approved-places'],
    queryFn: async () => {
      const { data } = await supabase
        .from('pending_places')
        .select('*')
        .eq('status', 'approved');

      if (!data) return [];

      return data.map((p): Business => {
        const cat = (p.category as Business['category']) || 'cafes';
        // Default working hours by category so open/closed badge works
        const defaultHours = cat === 'cafes'
          ? { mon: '07:00–23:00', tue: '07:00–23:00', wed: '07:00–23:00', thu: '07:00–23:00', fri: '07:00–23:00', sat: '07:00–23:00', sun: '08:00–23:00' }
          : cat === 'shops'
          ? { mon: '08:00–20:00', tue: '08:00–20:00', wed: '08:00–20:00', thu: '08:00–20:00', fri: '08:00–20:00', sat: '08:00–14:00', sun: '—' }
          : cat === 'restaurants'
          ? { mon: '11:00–23:00', tue: '11:00–23:00', wed: '11:00–23:00', thu: '11:00–23:00', fri: '11:00–23:00', sat: '11:00–23:00', sun: '11:00–23:00' }
          : { mon: '—', tue: '—', wed: '—', thu: '—', fri: '—', sat: '—', sun: '—' };

        return {
        id: `ap_${p.id}`,
        name: p.proposed_name,
        category: cat,
        address: p.proposed_address,
        phone: p.phone || '',
        website: p.website || undefined,
        workingHours: defaultHours,
        verified: false,
        lastVerified: p.reviewed_at || p.created_at,
        reportCount: 0,
        verificationStatus: 'community',
        communityConfirmedAt: p.reviewed_at || p.created_at,
        trustScore: 45,
        lat: p.lat ?? undefined,
        lng: p.lng ?? undefined,
      };
      });
    },
    staleTime: 5 * 60 * 1000,
  });
}
