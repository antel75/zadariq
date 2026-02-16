import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type PendingPlace = {
  id: string;
  proposed_name: string;
  proposed_address: string;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  website: string | null;
  category: string;
  proposed_smoking_status: string | null;
  created_at: string;
  status: string;
};

export function PendingPlacesTab() {
  const [places, setPlaces] = useState<PendingPlace[]>([]);
  const { toast } = useToast();

  const fetchPlaces = async () => {
    const { data } = await supabase
      .from('pending_places')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (data) setPlaces(data as unknown as PendingPlace[]);
  };

  useEffect(() => { fetchPlaces(); }, []);

  const approve = async (place: PendingPlace) => {
    // Update status to approved
    await supabase
      .from('pending_places')
      .update({ status: 'approved', reviewed_at: new Date().toISOString() })
      .eq('id', place.id);

    toast({ title: `✅ Approved: ${place.proposed_name}` });
    fetchPlaces();
  };

  const reject = async (placeId: string) => {
    await supabase
      .from('pending_places')
      .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
      .eq('id', placeId);

    toast({ title: 'Rejected' });
    fetchPlaces();
  };

  const smokingLabel = (s: string | null) => {
    if (s === 'allowed') return '🟢 Allowed';
    if (s === 'partial') return '🟡 Partial';
    if (s === 'not_allowed') return '🔴 Not allowed';
    return '—';
  };

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-3">{places.length} pending submissions</p>
      <div className="space-y-2">
        {places.map(p => (
          <Card key={p.id}>
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-foreground">{p.proposed_name}</span>
                    <Badge variant="secondary" className="text-[10px]">{p.category}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {p.proposed_address}
                  </p>
                  {p.phone && <p className="text-xs text-muted-foreground mt-0.5">📞 {p.phone}</p>}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-muted-foreground">Smoking: {smokingLabel(p.proposed_smoking_status)}</span>
                    <span className="text-[10px] text-muted-foreground">· {new Date(p.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-status-open" onClick={() => approve(p)}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => reject(p.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {places.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No pending cafe submissions.</p>}
      </div>
    </div>
  );
}
