import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Save, Trash2, Pencil, Clock } from 'lucide-react';
import { businesses, getTodayHours } from '@/data/mockData';
import { useBusinessHoursOverrides, getDayName, type BusinessHoursOverride } from '@/hooks/useBusinessHoursOverrides';

const DAYS = [
  { value: 1, label: 'Ponedjeljak' },
  { value: 2, label: 'Utorak' },
  { value: 3, label: 'Srijeda' },
  { value: 4, label: 'Četvrtak' },
  { value: 5, label: 'Petak' },
  { value: 6, label: 'Subota' },
  { value: 0, label: 'Nedjelja' },
];

export const BusinessHoursTab = () => {
  const { overrides, loading, saveOverride, deleteOverride } = useBusinessHoursOverrides();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Partial<BusinessHoursOverride> | null>(null);
  const [bulkBusinessId, setBulkBusinessId] = useState<string | null>(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkDays, setBulkDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [bulkOpen, setBulkOpen] = useState('08:00');
  const [bulkClose, setBulkClose] = useState('20:00');
  const [bulkClosed, setBulkClosed] = useState(false);

  const filteredBusinesses = businesses.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.id.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async () => {
    if (!editing) return;
    const ok = await saveOverride(editing);
    if (ok) {
      toast({ title: 'Spremljeno' });
      setEditing(null);
    } else {
      toast({ title: 'Greška pri spremanju', variant: 'destructive' });
    }
  };

  const handleBulkSave = async () => {
    if (!bulkBusinessId) return;
    let success = 0;
    for (const day of bulkDays) {
      const ok = await saveOverride({
        business_id: bulkBusinessId,
        day_of_week: day,
        open_time: bulkClosed ? null : bulkOpen,
        close_time: bulkClosed ? null : bulkClose,
        is_closed: bulkClosed,
      });
      if (ok) success++;
    }
    toast({ title: `Spremljeno ${success}/${bulkDays.length} dana` });
    setBulkMode(false);
    setBulkBusinessId(null);
  };

  const getOverridesForBusiness = (businessId: string) =>
    overrides.filter(o => o.business_id === businessId);

  if (loading) return <p className="text-sm text-muted-foreground text-center py-8">Učitavanje...</p>;

  return (
    <div className="space-y-4">
      <Input
        placeholder="Pretraži objekte po imenu..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="mb-3"
      />

      {/* Bulk editor */}
      {bulkMode && bulkBusinessId && (
        <Card className="border-primary/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Postavi radno vrijeme: {businesses.find(b => b.id === bulkBusinessId)?.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {DAYS.map(d => (
                <Badge
                  key={d.value}
                  variant={bulkDays.includes(d.value) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setBulkDays(prev =>
                    prev.includes(d.value) ? prev.filter(x => x !== d.value) : [...prev, d.value]
                  )}
                >
                  {d.label.slice(0, 3)}
                </Badge>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={bulkClosed} onCheckedChange={setBulkClosed} />
              <Label className="text-xs">Zatvoreno</Label>
            </div>
            {!bulkClosed && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Otvaranje</Label>
                  <Input type="time" value={bulkOpen} onChange={e => setBulkOpen(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Zatvaranje</Label>
                  <Input type="time" value={bulkClose} onChange={e => setBulkClose(e.target.value)} />
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <Button size="sm" onClick={handleBulkSave}>
                <Save className="h-4 w-4 mr-1" /> Spremi ({bulkDays.length} dana)
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setBulkMode(false); setBulkBusinessId(null); }}>
                Odustani
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Single edit */}
      {editing && (
        <Card className="border-primary/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              {editing.id ? 'Uredi' : 'Novi'} override
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Objekt</Label>
              <Select value={editing.business_id || ''} onValueChange={v => setEditing({ ...editing, business_id: v })}>
                <SelectTrigger><SelectValue placeholder="Odaberi objekt" /></SelectTrigger>
                <SelectContent>
                  {filteredBusinesses.slice(0, 20).map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Dan</Label>
                <Select value={String(editing.day_of_week ?? '')} onValueChange={v => setEditing({ ...editing, day_of_week: parseInt(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DAYS.map(d => (
                      <SelectItem key={d.value} value={String(d.value)}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 pt-5">
                <Switch checked={editing.is_closed ?? false} onCheckedChange={v => setEditing({ ...editing, is_closed: v })} />
                <Label className="text-xs">Zatvoreno</Label>
              </div>
            </div>
            {!editing.is_closed && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Otvaranje</Label>
                  <Input type="time" value={editing.open_time || ''} onChange={e => setEditing({ ...editing, open_time: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Zatvaranje</Label>
                  <Input type="time" value={editing.close_time || ''} onChange={e => setEditing({ ...editing, close_time: e.target.value })} />
                </div>
              </div>
            )}
            <div>
              <Label className="text-xs">Napomena</Label>
              <Input value={editing.notes || ''} onChange={e => setEditing({ ...editing, notes: e.target.value })} placeholder="npr. Zimsko radno vrijeme" />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave}><Save className="h-4 w-4 mr-1" /> Spremi</Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Odustani</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Business list */}
      <div className="space-y-2">
        {(search ? filteredBusinesses : filteredBusinesses.slice(0, 15)).map(b => {
          const bOverrides = getOverridesForBusiness(b.id);
          return (
            <Card key={b.id}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm text-foreground truncate block">{b.name}</span>
                    <span className="text-xs text-muted-foreground">{b.category} · Danas: {getTodayHours(b)}</span>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => {
                      setBulkBusinessId(b.id);
                      setBulkMode(true);
                    }}>
                      <Clock className="h-3 w-3 mr-1" /> Bulk
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditing({
                      business_id: b.id,
                      day_of_week: new Date().getDay(),
                      is_closed: false,
                      open_time: '08:00',
                      close_time: '20:00',
                    })}>
                      <Plus className="h-3 w-3 mr-1" /> Dan
                    </Button>
                  </div>
                </div>
                {bOverrides.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {bOverrides.map(o => (
                      <Badge key={o.id} variant="secondary" className="text-[10px] gap-1 cursor-pointer group" onClick={() => setEditing(o)}>
                        {getDayName(o.day_of_week)}: {o.is_closed ? 'Zatvoreno' : `${o.open_time?.slice(0, 5)}–${o.close_time?.slice(0, 5)}`}
                        <Trash2
                          className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 text-destructive"
                          onClick={(e) => { e.stopPropagation(); deleteOverride(o.id); toast({ title: 'Obrisano' }); }}
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
      {!search && <p className="text-xs text-muted-foreground text-center">Prikazano prvih 15 objekata. Pretraži za ostale.</p>}
    </div>
  );
};
