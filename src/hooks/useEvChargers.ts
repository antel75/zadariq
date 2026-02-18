import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type EvCharger = {
  id: string;
  name: string;
  operator: string | null;
  lat: number;
  lng: number;
  address: string | null;
  plug_types: string[];
  power_kw: number | null;
  plug_count: number;
  status: string;
  confidence: number;
  source: string;
  verified: boolean;
  last_reported_at: string | null;
  created_at: string;
  updated_at: string;
};

export type EvChargerReport = {
  id: string;
  charger_id: string;
  status: string;
  user_hash: string;
  created_at: string;
};

function generateUserHash(): string {
  let hash = localStorage.getItem('ev_user_hash');
  if (!hash) {
    hash = crypto.randomUUID();
    localStorage.setItem('ev_user_hash', hash);
  }
  return hash;
}

export function useEvChargers() {
  return useQuery({
    queryKey: ['ev-chargers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ev_chargers')
        .select('*')
        .order('name');
      if (error) throw error;
      return (data as unknown as EvCharger[]) || [];
    },
    staleTime: 60 * 1000,
  });
}

export function useEvChargerReports(chargerId?: string) {
  return useQuery({
    queryKey: ['ev-charger-reports', chargerId],
    queryFn: async () => {
      if (!chargerId) return [];
      const { data } = await supabase
        .from('ev_charger_reports')
        .select('*')
        .eq('charger_id', chargerId)
        .order('created_at', { ascending: false })
        .limit(8);
      return (data as unknown as EvChargerReport[]) || [];
    },
    enabled: !!chargerId,
    staleTime: 30 * 1000,
  });
}

export function useReportChargerStatus() {
  const queryClient = useQueryClient();
  const userHash = generateUserHash();

  return useMutation({
    mutationFn: async ({ chargerId, status }: { chargerId: string; status: string }) => {
      // Check cooldown (15 min)
      const { data: recent } = await supabase
        .from('ev_charger_reports')
        .select('created_at')
        .eq('charger_id', chargerId)
        .eq('user_hash', userHash)
        .order('created_at', { ascending: false })
        .limit(1);

      if (recent && recent.length > 0) {
        const lastReport = new Date(recent[0].created_at);
        const diff = Date.now() - lastReport.getTime();
        if (diff < 15 * 60 * 1000) {
          throw new Error('cooldown');
        }
      }

      // Insert report
      const { error } = await supabase
        .from('ev_charger_reports')
        .insert({
          charger_id: chargerId,
          status,
          user_hash: userHash,
        });
      if (error) throw error;

      // Recalculate status from last 8 reports
      const { data: reports } = await supabase
        .from('ev_charger_reports')
        .select('status')
        .eq('charger_id', chargerId)
        .order('created_at', { ascending: false })
        .limit(8);

      if (reports && reports.length > 0) {
        const counts: Record<string, number> = {};
        for (const r of reports) {
          counts[r.status] = (counts[r.status] || 0) + 1;
        }
        const total = reports.length;
        let newStatus = 'unknown';
        if ((counts['broken'] || 0) / total >= 0.4) newStatus = 'broken';
        else if ((counts['busy'] || 0) / total >= 0.6) newStatus = 'busy';
        else if ((counts['available'] || 0) / total >= 0.6) newStatus = 'available';

        const confidence = Math.min(100, total * 12);

        await supabase
          .from('ev_chargers')
          .update({
            status: newStatus,
            confidence,
            last_reported_at: new Date().toISOString(),
          })
          .eq('id', chargerId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ev-chargers'] });
      queryClient.invalidateQueries({ queryKey: ['ev-charger-reports'] });
    },
  });
}

// Utility to get status color
export function getChargerStatusColor(status: string): string {
  switch (status) {
    case 'available': return 'text-status-open';
    case 'busy': return 'text-status-warning';
    case 'broken': return 'text-destructive';
    default: return 'text-primary';
  }
}

export function getChargerStatusBg(status: string): string {
  switch (status) {
    case 'available': return 'bg-status-open/15';
    case 'busy': return 'bg-status-warning/15';
    case 'broken': return 'bg-destructive/15';
    default: return 'bg-primary/15';
  }
}

export function getChargerStatusLabel(status: string): string {
  switch (status) {
    case 'available': return 'Slobodno';
    case 'busy': return 'Zauzeto';
    case 'broken': return 'Ne radi';
    default: return 'Nema podataka';
  }
}

export function getConfidenceLabel(confidence: number, reportCount: number): string {
  if (reportCount === 0) return 'Nema informacija uživo';
  if (reportCount === 1) return 'Nepotvrđena informacija';
  if (confidence >= 80) return 'Pouzdano';
  if (confidence >= 50) return 'Djelomično pouzdano';
  return 'Malo izvješća';
}

// Simple distance calculation
export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (d: number) => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
