import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, X, MapPin, Pencil, Trash2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const PLACE_CATEGORIES = [
  'cafes', 'restaurants', 'shops', 'pharmacy', 'parking', 'doctors', 'dentists',
] as const;

type PlaceCategory = typeof PLACE_CATEGORIES[number];

type Place = {
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

export function ApprovedPlacesTab() {
  const [activeCategory, setActiveCategory] = useState<PlaceCategory>('cafes');
  const [pendingPlaces, setPendingPlaces] = useState<Place[]>([]);
  const [approvedPlaces, setApprovedPlaces] = useState<Place[]>([]);
  const [editing, setEditing] = useState<Place | null>(null);
  const { toast } = useToast();

  const fetchAll = async () => {
    const { data: pending } = await supabase
      .from('pending_places')
      .select('*')
      .eq('status', 'pending')
      .eq('category', activeCategory)
      .order('created_at', { ascending: false });
    if (pending) setPendingPlaces(pending as unknown as Place[]);

    const { data: approved } = await supabase
      .from('pending_places')
      .select('*')
      .eq('status', 'approved')
      .eq('category', activeCategory)
      .order('proposed_name');
    if (approved) setApprovedPlaces(approved as unknown as Place[]);
  };

  useEffect(() => { fetchAll(); }, [activeCategory]);

  const approve = async (place: Place) => {
    await supabase
      .from('pending_places')
      .update({ status: 'approved', reviewed_at: new Date().toISOString() })
      .eq('id', place.id);
    toast({ title: `✅ Approved: ${place.proposed_name}` });
    fetchAll();
  };

  const reject = async (id: string) => {
    await supabase
      .from('pending_places')
      .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
      .eq('id', id);
    toast({ title: 'Rejected' });
    fetchAll();
  };

  const deletePlace = async (id: string, name: string) => {
    if (!confirm(`Obrisati "${name}"?`)) return;
    await supabase.from('pending_places').delete().eq('id', id);
    toast({ title: `🗑️ Deleted: ${name}` });
    fetchAll();
  };

  const saveEdit = async () => {
    if (!editing) return;
    await supabase
      .from('pending_places')
      .update({
        proposed_name: editing.proposed_name,
        proposed_address: editing.proposed_address,
        phone: editing.phone,
        website: editing.website,
        lat: editing.lat,
        lng: editing.lng,
        proposed_smoking_status: editing.proposed_smoking_status,
        category: editing.category,
      })
      .eq('id', editing.id);
    toast({ title: `✏️ Updated: ${editing.proposed_name}` });
    setEditing(null);
    fetchAll();
  };

  const smokingLabel = (s: string | null) => {
    if (s === 'allowed') return '🟢 Allowed';
    if (s === 'partial') return '🟡 Partial';
    if (s === 'not_allowed') return '🔴 Not allowed';
    return '—';
  };

  const renderPlaceCard = (p: Place, showApproveReject: boolean) => (
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
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-[10px] text-muted-foreground">Smoking: {smokingLabel(p.proposed_smoking_status)}</span>
              {p.lat && p.lng && <span className="text-[10px] text-muted-foreground">📍 {p.lat.toFixed(4)}, {p.lng.toFixed(4)}</span>}
              <span className="text-[10px] text-muted-foreground">· {new Date(p.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex gap-1">
            {showApproveReject && (
              <>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-status-open" onClick={() => approve(p)}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => reject(p.id)}>
                  <X className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditing({ ...p })}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deletePlace(p.id, p.proposed_name)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div>
      {/* Category filter chips */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {PLACE_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => { setActiveCategory(cat); setEditing(null); }}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              activeCategory === cat
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Edit modal */}
      {editing && (
        <Card className="mb-4 border-primary/30">
          <CardContent className="p-3 space-y-3">
            <p className="text-sm font-semibold text-foreground">Edit Place</p>
            <div>
              <Label className="text-xs">Name</Label>
              <Input value={editing.proposed_name} onChange={e => setEditing({ ...editing, proposed_name: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Address</Label>
              <Input value={editing.proposed_address} onChange={e => setEditing({ ...editing, proposed_address: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Phone</Label>
                <Input value={editing.phone || ''} onChange={e => setEditing({ ...editing, phone: e.target.value || null })} />
              </div>
              <div>
                <Label className="text-xs">Website</Label>
                <Input value={editing.website || ''} onChange={e => setEditing({ ...editing, website: e.target.value || null })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Lat</Label>
                <Input type="number" step="0.0001" value={editing.lat ?? ''} onChange={e => setEditing({ ...editing, lat: e.target.value ? parseFloat(e.target.value) : null })} />
              </div>
              <div>
                <Label className="text-xs">Lng</Label>
                <Input type="number" step="0.0001" value={editing.lng ?? ''} onChange={e => setEditing({ ...editing, lng: e.target.value ? parseFloat(e.target.value) : null })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Category</Label>
                <select
                  value={editing.category}
                  onChange={e => setEditing({ ...editing, category: e.target.value })}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {PLACE_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs">Smoking</Label>
                <Input value={editing.proposed_smoking_status || ''} onChange={e => setEditing({ ...editing, proposed_smoking_status: e.target.value || null })} placeholder="allowed/partial/not_allowed" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={saveEdit}><Save className="h-4 w-4 mr-1" /> Save</Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending submissions */}
      <p className="text-sm font-medium text-foreground mb-2">⏳ Pending ({pendingPlaces.length})</p>
      <div className="space-y-2 mb-6">
        {pendingPlaces.map(p => renderPlaceCard(p, true))}
        {pendingPlaces.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No pending {activeCategory}.</p>}
      </div>

      {/* Approved places */}
      <p className="text-sm font-medium text-foreground mb-2">✅ Approved ({approvedPlaces.length})</p>
      <div className="space-y-2">
        {approvedPlaces.map(p => renderPlaceCard(p, false))}
        {approvedPlaces.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No approved {activeCategory} yet.</p>}
      </div>
    </div>
  );
}
