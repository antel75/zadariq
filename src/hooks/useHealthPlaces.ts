import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Business } from '@/data/types';

export type HealthSubcategory = 'opca' | 'dentalna' | 'specijalisticka' | 'bolnica' | 'ljekarna';

export interface HealthPlace {
  id: string;
  name: string;
  subcategory: HealthSubcategory;
  specialty: string | null;
  address: string | null;
  neighborhood: string | null;
  phone: string | null;
  website: string | null;
  description: string | null;
  head_doctor: string | null;
  hours: { mon_fri?: string; sat?: string; sun?: string } | Record<string, string>;
  lat: number | null;
  lng: number | null;
  display_order: number;
  enabled: boolean;
  verified: boolean;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
}

const subToCategory: Record<HealthSubcategory, Business['category']> = {
  opca: 'doctor',
  dentalna: 'dentist',
  specijalisticka: 'medicine',
  bolnica: 'medicine',
  ljekarna: 'pharmacy',
};

export function healthPlaceToBusiness(p: HealthPlace): Business {
  const h = (p.hours as any) || {};
  const monFri = h.mon_fri || '—';
  const sat = h.sat || '—';
  const sun = h.sun || '—';
  return {
    id: `hp-${p.id}`,
    name: p.name,
    category: subToCategory[p.subcategory],
    address: p.address || '',
    phone: p.phone || '',
    website: p.website || undefined,
    workingHours: {
      mon: monFri, tue: monFri, wed: monFri, thu: monFri, fri: monFri,
      sat, sun,
    },
    verified: p.verified,
    lastVerified: (p.updated_at || p.created_at || new Date().toISOString()).slice(0, 10),
    reportCount: 0,
    lat: p.lat ?? undefined,
    lng: p.lng ?? undefined,
    verificationStatus: p.verified ? 'community' : 'unverified',
    trustScore: p.verified ? 70 : 40,
  };
}

export function useHealthPlaces() {
  const [data, setData] = useState<HealthPlace[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    const { data: rows, error } = await supabase
      .from('health_places' as any)
      .select('*')
      .order('subcategory')
      .order('display_order');
    if (!error && rows) setData(rows as unknown as HealthPlace[]);
    setLoading(false);
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  return { data, loading, refetch };
}

export async function saveHealthPlace(p: Partial<HealthPlace> & { id?: string }) {
  if (p.id) {
    const { id, created_at, updated_at, ...patch } = p as any;
    const { error } = await supabase.from('health_places' as any).update(patch).eq('id', id);
    return !error;
  }
  const { error } = await supabase.from('health_places' as any).insert(p as any);
  return !error;
}

export async function deleteHealthPlace(id: string) {
  const { error } = await supabase.from('health_places' as any).delete().eq('id', id);
  return !error;
}