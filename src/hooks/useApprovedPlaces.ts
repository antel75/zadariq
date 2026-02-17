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

      return data.map((p): Business => ({
        id: `ap_${p.id}`,
        name: p.proposed_name,
        category: (p.category as Business['category']) || 'cafes',
        address: p.proposed_address,
        phone: p.phone || '',
        website: p.website || undefined,
        workingHours: { mon: '—', tue: '—', wed: '—', thu: '—', fri: '—', sat: '—', sun: '—' },
        verified: false,
        lastVerified: p.reviewed_at || p.created_at,
        reportCount: 0,
        verificationStatus: 'community',
        communityConfirmedAt: p.reviewed_at || p.created_at,
        trustScore: 45,
        lat: p.lat ?? undefined,
        lng: p.lng ?? undefined,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });
}
