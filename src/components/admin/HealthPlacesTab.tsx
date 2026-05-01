import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Save, Trash2, Pencil, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useHealthPlaces, saveHealthPlace, deleteHealthPlace, type HealthPlace, type HealthSubcategory } from '@/hooks/useHealthPlaces';

const SUBS: { value: HealthSubcategory; label: string }[] = [
  { value: 'opca', label: 'Opća' },
  { value: 'dentalna', label: 'Dentalna' },
  { value: 'specijalisticka', label: 'Specijalistička' },
  { value: 'bolnica', label: 'Bolnica / Odjel' },
  { value: 'ljekarna', label: 'Ljekarna' },
];

const blank = (): Partial<HealthPlace> => ({
  name: '',
  subcategory: 'specijalisticka',
  address: '',
  phone: '',
  website: '',
  specialty: '',
  head_doctor: '',
  description: '',
  hours: { mon_fri: '08:00–16:00', sat: 'Zatvoreno', sun: 'Zatvoreno' },
  display_order: 100,
  enabled: true,
  verified: false,
  notes: '',
});

export const HealthPlacesTab = () => {
  const { data, loading, refetch } = useHealthPlaces();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [subFilter, setSubFilter] = useState<HealthSubcategory | 'all'>('all');
  const [editing, setEditing] = useState<Partial<HealthPlace> | null>(null);

  const filtered = useMemo(() => {
    return data.filter(p => {
      if (subFilter !== 'all' && p.subcategory !== subFilter) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [data, subFilter, search]);

  const handleSave = async () => {
    if (!editing?.name || !editing.subcategory) {
      toast({ title: 'Naziv i sub-kategorija su obavezni', variant: 'destructive' });
      return;
    }
    const ok = await saveHealthPlace(editing as HealthPlace);
    if (ok) {
      toast({ title: editing.id ? 'Spremljeno' : 'Dodano' });
      setEditing(null);
      refetch();
    } else {
      toast({ title: 'Greška pri spremanju', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Obrisati "${name}"? Ova akcija se ne može poništiti.`)) return;
    const ok = await deleteHealthPlace(id);
    if (ok) {
      toast({ title: 'Obrisano' });
      refetch();
    } else {
      toast({ title: 'Greška pri brisanju', variant: 'destructive' });
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground text-center py-8">Učitavanje...</p>;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder="Pretraži po nazivu..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1"
        />
        <Button size="sm" onClick={() => setEditing(blank())}>
          <Plus className="h-4 w-4 mr-1" /> Novi
        </Button>
      </div>

      <div className="flex gap-1 flex-wrap">
        {([{ value: 'all', label: 'Sve' }, ...SUBS] as const).map(s => (
          <Badge
            key={s.value}
            variant={subFilter === s.value ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSubFilter(s.value as any)}
          >
            {s.label} {s.value !== 'all' && `(${data.filter(d => d.subcategory === s.value).length})`}
          </Badge>
        ))}
      </div>

      {editing && (
        <Card className="border-primary/40">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm">{editing.id ? 'Uredi unos' : 'Novi unos'}</CardTitle>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(null)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Naziv *</Label>
              <Input value={editing.name || ''} onChange={e => setEditing({ ...editing, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Sub-kategorija *</Label>
                <Select value={editing.subcategory} onValueChange={v => setEditing({ ...editing, subcategory: v as HealthSubcategory })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SUBS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Specijalnost</Label>
                <Input value={editing.specialty || ''} onChange={e => setEditing({ ...editing, specialty: e.target.value })} placeholder="npr. pedijatar" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Adresa</Label>
              <Input value={editing.address || ''} onChange={e => setEditing({ ...editing, address: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Telefon</Label>
                <Input value={editing.phone || ''} onChange={e => setEditing({ ...editing, phone: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Web</Label>
                <Input value={editing.website || ''} onChange={e => setEditing({ ...editing, website: e.target.value })} />
              </div>
            </div>
            <div>
              <Label className="text-xs">Pročelnik / Voditelj</Label>
              <Input value={editing.head_doctor || ''} onChange={e => setEditing({ ...editing, head_doctor: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Radno vrijeme</Label>
              <div className="grid grid-cols-3 gap-1">
                <Input
                  placeholder="Pon–Pet"
                  value={(editing.hours as any)?.mon_fri || ''}
                  onChange={e => setEditing({ ...editing, hours: { ...(editing.hours || {}), mon_fri: e.target.value } as any })}
                />
                <Input
                  placeholder="Sub"
                  value={(editing.hours as any)?.sat || ''}
                  onChange={e => setEditing({ ...editing, hours: { ...(editing.hours || {}), sat: e.target.value } as any })}
                />
                <Input
                  placeholder="Ned"
                  value={(editing.hours as any)?.sun || ''}
                  onChange={e => setEditing({ ...editing, hours: { ...(editing.hours || {}), sun: e.target.value } as any })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Lat</Label>
                <Input type="number" step="0.0001" value={editing.lat ?? ''} onChange={e => setEditing({ ...editing, lat: e.target.value ? parseFloat(e.target.value) : null })} />
              </div>
              <div>
                <Label className="text-xs">Lng</Label>
                <Input type="number" step="0.0001" value={editing.lng ?? ''} onChange={e => setEditing({ ...editing, lng: e.target.value ? parseFloat(e.target.value) : null })} />
              </div>
            </div>
            <div>
              <Label className="text-xs">Opis / Bilješka (interno)</Label>
              <Textarea rows={2} value={editing.notes || ''} onChange={e => setEditing({ ...editing, notes: e.target.value })} />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={editing.enabled ?? true} onCheckedChange={v => setEditing({ ...editing, enabled: v })} />
                <Label className="text-xs">Vidljivo javno</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={editing.verified ?? false} onCheckedChange={v => setEditing({ ...editing, verified: v })} />
                <Label className="text-xs">Provjereno</Label>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave}><Save className="h-4 w-4 mr-1" /> Spremi</Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Odustani</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {filtered.map(p => (
          <Card key={p.id} className={!p.enabled ? 'opacity-50' : ''}>
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-foreground">{p.name}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {SUBS.find(s => s.value === p.subcategory)?.label}
                    </Badge>
                    {!p.verified && <Badge variant="secondary" className="text-[10px]">u pripremi</Badge>}
                    {!p.enabled && <Badge variant="destructive" className="text-[10px]">skriveno</Badge>}
                  </div>
                  {p.address && <p className="text-xs text-muted-foreground mt-0.5">{p.address}</p>}
                  {p.phone && <p className="text-xs text-muted-foreground">📞 {p.phone}</p>}
                  {p.head_doctor && <p className="text-xs text-muted-foreground">👤 {p.head_doctor}</p>}
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(p)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(p.id, p.name)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8">Nema unosa.</p>
        )}
      </div>
    </div>
  );
};