import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Save, Zap, Droplets } from 'lucide-react';

type Outage = {
  id: string;
  area: string;
  outage_date: string;
  time_from: string | null;
  time_until: string | null;
};

function newOutage(): Omit<Outage, 'id'> {
  return {
    area: '',
    outage_date: new Date().toISOString().split('T')[0],
    time_from: '',
    time_until: '',
  };
}

function OutageSection({ title, table, icon: Icon, iconColor }: {
  title: string;
  table: 'power_outages' | 'water_outages';
  icon: React.ElementType;
  iconColor: string;
}) {
  const { toast } = useToast();
  const [outages, setOutages] = useState<Outage[]>([]);
  const [editing, setEditing] = useState<Partial<Outage> | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await supabase.from(table).select('*').order('outage_date', { ascending: false });
    setOutages((data as Outage[]) || []);
  }

  async function save() {
    if (!editing) return;
    if (!editing.area || !editing.outage_date) {
      toast({ title: 'Popuni područje i datum!', variant: 'destructive' });
      return;
    }
    const payload = {
      area: editing.area,
      outage_date: editing.outage_date,
      time_from: editing.time_from || null,
      time_until: editing.time_until || null,
    };
    if (editing.id) {
      await supabase.from(table).update(payload).eq('id', editing.id);
    } else {
      await supabase.from(table).insert(payload);
    }
    toast({ title: '✅ Spremljeno!' });
    setEditing(null);
    load();
  }

  async function remove(id: string) {
    await supabase.from(table).delete().eq('id', id);
    toast({ title: '🗑️ Obrisano!' });
    load();
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${iconColor}`} />
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <Badge variant="secondary" className="text-[10px]">{outages.length}</Badge>
        </div>
        <Button size="sm" onClick={() => setEditing(newOutage())}>
          <Plus className="h-4 w-4 mr-1" /> Dodaj
        </Button>
      </div>
      {editing && (
        <Card className="mb-4 border-primary/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{editing.id ? 'Uredi' : 'Novi'} nestanak</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Područje / ulice</Label>
              <Input value={editing.area || ''} onChange={e => setEditing({ ...editing, area: e.target.value })} placeholder="npr. Ul. Stjepana Radića, Brodarica..." />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Datum</Label>
                <Input type="date" value={editing.outage_date || today} onChange={e => setEditing({ ...editing, outage_date: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Od</Label>
                <Input type="time" value={editing.time_from || ''} onChange={e => setEditing({ ...editing, time_from: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Do</Label>
                <Input type="time" value={editing.time_until || ''} onChange={e => setEditing({ ...editing, time_until: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={save}><Save className="h-4 w-4 mr-1" /> Spremi</Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Odustani</Button>
            </div>
          </CardContent>
        </Card>
      )}
      <div className="space-y-2">
        {outages.map(o => {
          const isToday = o.outage_date === today;
          const isPast = o.outage_date < today;
          return (
            <Card key={o.id} className={isPast ? 'opacity-40' : ''}>
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-xs text-foreground">{o.area}</span>
                    {isToday && <Badge className="text-[10px] bg-destructive/15 text-destructive border-0">Danas</Badge>}
                    {isPast && <Badge variant="outline" className="text-[10px]">Prošlo</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {o.outage_date}{o.time_from && o.time_until && ` · ${o.time_from} – ${o.time_until}`}
                  </p>
                </div>
                <div className="flex gap-1 ml-2">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditing(o)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => remove(o.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {outages.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Nema unesenih nestanaka.</p>}
      </div>
    </div>
  );
}

export function OutagesTab() {
  return (
    <div>
      <OutageSection title="Nestanak struje" table="power_outages" icon={Zap} iconColor="text-yellow-500" />
      <div className="border-t border-border my-4" />
      <OutageSection title="Nestanak vode" table="water_outages" icon={Droplets} iconColor="text-blue-500" />
    </div>
  );
}
