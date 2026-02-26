import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Save } from 'lucide-react';

type CityEvent = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  venue: string | null;
  event_date_from: string | null;
  event_date_to: string | null;
  image_url: string | null;
  website_url: string | null;
  category: string | null;
  region: string | null;
  source: string | null;
};

const empty = (): Partial<CityEvent> => ({
  title: '', description: '', location: '', venue: '',
  event_date_from: '', event_date_to: '', image_url: '',
  website_url: '', category: 'kultura', region: 'zadar', source: 'manual'
});

export function EventsTab() {
  const { toast } = useToast();
  const [events, setEvents] = useState<CityEvent[]>([]);
  const [editing, setEditing] = useState<Partial<CityEvent> | null>(null);

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    const { data } = await supabase.from('city_events').select('*').order('event_date_from', { ascending: true });
    setEvents(data || []);
  };

  const save = async () => {
    if (!editing?.title || !editing?.event_date_from) {
      toast({ title: 'Greška', description: 'Naslov i datum su obavezni.', variant: 'destructive' });
      return;
    }
    if (editing.id) {
      await supabase.from('city_events').update(editing).eq('id', editing.id);
    } else {
      await supabase.from('city_events').insert(editing);
    }
    toast({ title: 'Spremljeno!' });
    setEditing(null);
    fetchEvents();
  };

  const remove = async (id: string) => {
    await supabase.from('city_events').delete().eq('id', id);
    fetchEvents();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-sm">Događaji ({events.length})</h3>
        <Button size="sm" onClick={() => setEditing(empty())}><Plus className="h-4 w-4 mr-1" />Dodaj</Button>
      </div>

      {editing && (
        <div className="border rounded-lg p-4 space-y-3 bg-card">
          <h4 className="text-sm font-semibold">{editing.id ? 'Uredi događaj' : 'Novi događaj'}</h4>
          <Input placeholder="Naslov *" value={editing.title || ''} onChange={e => setEditing({...editing, title: e.target.value})} />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground">Datum od *</label>
              <Input type="date" value={editing.event_date_from || ''} onChange={e => setEditing({...editing, event_date_from: e.target.value})} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Datum do</label>
              <Input type="date" value={editing.event_date_to || ''} onChange={e => setEditing({...editing, event_date_to: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground">Kategorija</label>
              <Select value={editing.category || 'kultura'} onValueChange={v => setEditing({...editing, category: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="kultura">🎭 Kultura</SelectItem>
                  <SelectItem value="nocni-zivot">🎉 Noćni život</SelectItem>
                  <SelectItem value="festival">🎪 Festival</SelectItem>
                  <SelectItem value="festa">🎊 Fešta</SelectItem>
                  <SelectItem value="sport">🏃 Sport</SelectItem>
                  <SelectItem value="koncerti">🎵 Koncerti</SelectItem>
                  <SelectItem value="gastro">🍷 Gastro</SelectItem>
                  <SelectItem value="izlozbe">🎨 Izložbe</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Regija</label>
              <Select value={editing.region || 'zadar'} onValueChange={v => setEditing({...editing, region: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="zadar">Zadar</SelectItem>
                  <SelectItem value="zrce">Zrće</SelectItem>
                  <SelectItem value="tisno">Tisno</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Input placeholder="Venue (npr. Arsenale)" value={editing.venue || ''} onChange={e => setEditing({...editing, venue: e.target.value})} />
          <Input placeholder="Lokacija (adresa)" value={editing.location || ''} onChange={e => setEditing({...editing, location: e.target.value})} />
          <Input placeholder="Website URL" value={editing.website_url || ''} onChange={e => setEditing({...editing, website_url: e.target.value})} />
          <Input placeholder="Slika URL" value={editing.image_url || ''} onChange={e => setEditing({...editing, image_url: e.target.value})} />
          <textarea
            className="w-full border rounded p-2 text-sm bg-background resize-none"
            rows={3}
            placeholder="Opis..."
            value={editing.description || ''}
            onChange={e => setEditing({...editing, description: e.target.value})}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={save}><Save className="h-4 w-4 mr-1" />Spremi</Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(null)}>Odustani</Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {events.map(ev => (
          <div key={ev.id} className="flex items-center justify-between border rounded p-2 text-sm">
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{ev.title}</p>
              <p className="text-xs text-muted-foreground">{ev.event_date_from} · {ev.category} · {ev.region} · {ev.source}</p>
            </div>
            <div className="flex gap-1 shrink-0 ml-2">
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(ev)}>✏️</Button>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => remove(ev.id)}><Trash2 className="h-3 w-3" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
