import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Save, Trash2, Calendar, Store } from 'lucide-react';
import { businesses } from '@/data/mockData';
import { useApprovedPlaces } from '@/hooks/useApprovedPlaces';

type SundayEntry = {
  id: string;
  business_id: string;
  sunday_date: string;
  open_time: string | null;
  close_time: string | null;
  notes: string | null;
};

// Get all Sundays for a given year
function getSundaysOfYear(year: number): string[] {
  const sundays: string[] = [];
  const d = new Date(year, 0, 1);
  // Move to first Sunday
  while (d.getDay() !== 0) d.setDate(d.getDate() + 1);
  while (d.getFullYear() === year) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    sundays.push(`${yyyy}-${mm}-${dd}`);
    d.setDate(d.getDate() + 7);
  }
  return sundays;
}

export function ShopSundayTab() {
  const [entries, setEntries] = useState<SundayEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Partial<SundayEntry> | null>(null);
  const { toast } = useToast();
  const { data: approvedPlaces } = useApprovedPlaces();

  const currentYear = new Date().getFullYear();
  const allSundays = useMemo(() => getSundaysOfYear(currentYear), [currentYear]);

  const allShops = useMemo(() => {
    const mockShops = businesses.filter(b => b.category === 'shops');
    const approvedShops = (approvedPlaces || []).filter(b => b.category === 'shops');
    return [...mockShops, ...approvedShops];
  }, [approvedPlaces]);

  const filteredShops = useMemo(() =>
    allShops.filter(s => s.name.toLowerCase().includes(search.toLowerCase())),
    [allShops, search]
  );

  const fetchEntries = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('shop_sunday_schedule')
      .select('*')
      .gte('sunday_date', `${currentYear}-01-01`)
      .lte('sunday_date', `${currentYear}-12-31`)
      .order('sunday_date');
    if (data) setEntries(data as unknown as SundayEntry[]);
    setLoading(false);
  };

  useEffect(() => { fetchEntries(); }, []);

  const getEntriesForShop = (businessId: string) =>
    entries.filter(e => e.business_id === businessId);

  const getShopName = (businessId: string) =>
    allShops.find(s => s.id === businessId)?.name || businessId;

  const handleSave = async () => {
    if (!editing?.business_id || !editing?.sunday_date) return;
    const record = {
      business_id: editing.business_id,
      sunday_date: editing.sunday_date,
      open_time: editing.open_time || '08:00',
      close_time: editing.close_time || '21:00',
      notes: editing.notes || null,
    };

    if (editing.id) {
      const { error } = await supabase.from('shop_sunday_schedule').update(record).eq('id', editing.id);
      if (error) { toast({ title: 'Greška', variant: 'destructive' }); return; }
    } else {
      const { error } = await supabase.from('shop_sunday_schedule').insert(record);
      if (error) { toast({ title: 'Greška (možda duplikat)', variant: 'destructive' }); return; }
    }
    toast({ title: '✅ Spremljeno' });
    setEditing(null);
    fetchEntries();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('shop_sunday_schedule').delete().eq('id', id);
    toast({ title: '🗑️ Obrisano' });
    fetchEntries();
  };

  // Get upcoming Sundays (next 8 weeks)
  const today = new Date().toISOString().split('T')[0];
  const upcomingSundays = allSundays.filter(s => s >= today).slice(0, 8);

  if (loading) return <p className="text-sm text-muted-foreground text-center py-8">Učitavanje...</p>;

  return (
    <div className="space-y-4">
      <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
        <p className="text-xs text-muted-foreground">
          <Store className="h-3 w-3 inline mr-1" />
          Trgovine u RH mogu raditi najviše <strong>16 nedjelja</strong> godišnje. 
          Ovdje označavaš koje nedjelje koji dućan radi.
        </p>
      </div>

      <Input
        placeholder="Pretraži dućane..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {/* Add new entry */}
      {editing && (
        <Card className="border-primary/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {editing.id ? 'Uredi' : 'Dodaj'} radnu nedjelju
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Dućan</Label>
              <Select value={editing.business_id || ''} onValueChange={v => setEditing({ ...editing, business_id: v })}>
                <SelectTrigger><SelectValue placeholder="Odaberi dućan" /></SelectTrigger>
                <SelectContent>
                  {filteredShops.slice(0, 30).map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Nedjelja (datum)</Label>
              <Select value={editing.sunday_date || ''} onValueChange={v => setEditing({ ...editing, sunday_date: v })}>
                <SelectTrigger><SelectValue placeholder="Odaberi nedjelju" /></SelectTrigger>
                <SelectContent>
                  {upcomingSundays.map(s => (
                    <SelectItem key={s} value={s}>
                      {new Date(s + 'T00:00:00').toLocaleDateString('hr', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Otvaranje</Label>
                <Input type="time" value={editing.open_time || '08:00'} onChange={e => setEditing({ ...editing, open_time: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Zatvaranje</Label>
                <Input type="time" value={editing.close_time || '21:00'} onChange={e => setEditing({ ...editing, close_time: e.target.value })} />
              </div>
            </div>
            <div>
              <Label className="text-xs">Napomena</Label>
              <Input value={editing.notes || ''} onChange={e => setEditing({ ...editing, notes: e.target.value })} placeholder="npr. Blagdanski vikend" />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave}><Save className="h-4 w-4 mr-1" /> Spremi</Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Odustani</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!editing && (
        <Button size="sm" onClick={() => setEditing({ open_time: '08:00', close_time: '21:00' })}>
          <Plus className="h-4 w-4 mr-1" /> Dodaj radnu nedjelju
        </Button>
      )}

      {/* Per-shop view */}
      <div className="space-y-2">
        {(search ? filteredShops : filteredShops.slice(0, 15)).map(shop => {
          const shopEntries = getEntriesForShop(shop.id);
          const usedCount = shopEntries.length;
          const remaining = 16 - usedCount;
          return (
            <Card key={shop.id}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm text-foreground truncate block">{shop.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {usedCount}/16 nedjelja iskorišteno ·{' '}
                      <span className={remaining <= 3 ? 'text-destructive font-medium' : ''}>
                        {remaining} preostalo
                      </span>
                    </span>
                  </div>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditing({ business_id: shop.id, open_time: '08:00', close_time: '21:00' })}>
                    <Plus className="h-3 w-3 mr-1" /> Ned.
                  </Button>
                </div>
                {shopEntries.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {shopEntries.map(e => (
                      <Badge key={e.id} variant="secondary" className="text-[10px] gap-1 cursor-pointer group" onClick={() => setEditing(e)}>
                        {new Date(e.sunday_date + 'T00:00:00').toLocaleDateString('hr', { day: 'numeric', month: 'short' })}
                        {' '}{(e.open_time || '08:00').slice(0, 5)}–{(e.close_time || '21:00').slice(0, 5)}
                        <Trash2
                          className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 text-destructive"
                          onClick={(ev) => { ev.stopPropagation(); handleDelete(e.id); }}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      {!search && <p className="text-xs text-muted-foreground text-center">Prikazano prvih 15 dućana. Pretraži za ostale.</p>}
    </div>
  );
}
