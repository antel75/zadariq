import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  submitter_email: string | null;
  created_at: string;
  status: string;
};

export function PendingObjectsTab() {
  const [places, setPlaces] = useState<PendingPlace[]>([]);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
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

  const sendEmail = async (to: string, subject: string, html: string) => {
    try {
      await supabase.functions.invoke('send-email', {
        body: { to, subject, html },
      });
    } catch (err) {
      console.error('Email send failed:', err);
    }
  };

  const approve = async (place: PendingPlace) => {
    await supabase
      .from('pending_places')
      .update({ status: 'approved', reviewed_at: new Date().toISOString() })
      .eq('id', place.id);

    if (place.submitter_email) {
      await sendEmail(
        place.submitter_email,
        `✅ Vaš objekt "${place.proposed_name}" je odobren – ZadarIQ`,
        `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#16a34a">✅ Objekt odobren!</h2>
          <p>Vaš objekt <strong>${place.proposed_name}</strong> na adresi <em>${place.proposed_address}</em> je pregledan i odobren od strane ZadarIQ tima.</p>
          <p>Sada je vidljiv svim korisnicima na platformi.</p>
          <p style="margin-top:24px">
            <a href="https://zadariq.city/owner/login" style="background:#2563eb;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600">Prijavi se i postavi profil →</a>
          </p>
          <p style="color:#6b7280;font-size:12px;margin-top:24px">ZadarIQ · Zadar City Intelligence</p>
        </div>`
      );
    }

    toast({ title: `✅ Odobreno: ${place.proposed_name}` });
    fetchPlaces();
  };

  const reject = async (place: PendingPlace) => {
    await supabase
      .from('pending_places')
      .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
      .eq('id', place.id);

    if (place.submitter_email && rejectReason) {
      await sendEmail(
        place.submitter_email,
        `❌ Vaš objekt "${place.proposed_name}" nije odobren – ZadarIQ`,
        `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#dc2626">❌ Objekt nije odobren</h2>
          <p>Vaš objekt <strong>${place.proposed_name}</strong> na adresi <em>${place.proposed_address}</em> nije odobren.</p>
          <p><strong>Razlog:</strong> ${rejectReason}</p>
          <p>Možete pokušati ponovo s ispravnim podacima.</p>
          <p style="color:#6b7280;font-size:12px;margin-top:24px">ZadarIQ · Zadar City Intelligence</p>
        </div>`
      );
    }

    toast({ title: `❌ Odbijeno: ${place.proposed_name}` });
    setRejectingId(null);
    setRejectReason('');
    fetchPlaces();
  };

  const smokingLabel = (s: string | null) => {
    if (s === 'allowed') return '🟢 Dozvoljeno';
    if (s === 'partial') return '🟡 Djelomično';
    if (s === 'not_allowed') return '🔴 Zabranjeno';
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
                  {p.website && <p className="text-xs text-muted-foreground mt-0.5">🌐 {p.website}</p>}
                  {(p as any).details?.subcategory && <p className="text-xs text-muted-foreground mt-0.5">📂 {(p as any).details.subcategory}</p>}
                  {(p as any).details?.forte && <p className="text-xs text-muted-foreground mt-0.5">⭐ {(p as any).details.forte}</p>}
                  {(p as any).details?.hours && (
                    <div className="mt-1 text-[10px] text-muted-foreground">
                      🕐 {Object.entries((p as any).details.hours).map(([day, hours]: any) => `${day}: ${hours}`).join(' · ')}
                    </div>
                  )}
                  {(p as any).lat && (p as any).lng && (
                    <a href={`https://maps.google.com/?q=${(p as any).lat},${(p as any).lng}`} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-primary mt-0.5 block hover:underline">
                      📍 Otvori na karti
                    </a>
                  )}
                  {p.submitter_email && <p className="text-xs text-muted-foreground mt-0.5">✉️ {p.submitter_email}</p>}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-muted-foreground">Pušenje: {smokingLabel(p.proposed_smoking_status)}</span>
                    <span className="text-[10px] text-muted-foreground">· {new Date(p.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-status-open" onClick={() => approve(p)}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setRejectingId(rejectingId === p.id ? null : p.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {rejectingId === p.id && (
                <div className="mt-2 flex gap-2">
                  <Input
                    placeholder="Razlog odbijanja..."
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    className="text-xs"
                  />
                  <Button size="sm" variant="destructive" onClick={() => reject(p)} disabled={!rejectReason}>
                    Odbij
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {places.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nema novih prijava objekata.</p>}
      </div>
    </div>
  );
}
