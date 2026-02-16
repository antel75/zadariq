import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Save, RefreshCw } from 'lucide-react';

type CityAlert = {
  id: string;
  title: string;
  summary: string;
  source: string;
  source_url: string | null;
  priority: number;
  valid_until: string;
  type: string;
  created_at: string;
};

export function CityAlertsTab() {
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<CityAlert[]>([]);
  const [editing, setEditing] = useState<Partial<CityAlert> | null>(null);
  const [scraping, setScraping] = useState(false);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    const { data } = await supabase
      .from('city_alerts')
      .select('*')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setAlerts(data as unknown as CityAlert[]);
  };

  const runScrapers = async () => {
    setScraping(true);
    try {
      const { data, error } = await supabase.functions.invoke('scrape-city-alerts');
      if (error) throw error;
      toast({ title: 'Scrapers ran', description: `Parsed: ${data?.parsed}, Inserted: ${data?.inserted}` });
      fetchAlerts();
    } catch (e) {
      toast({ title: 'Error', description: String(e), variant: 'destructive' });
    } finally {
      setScraping(false);
    }
  };

  const saveAlert = async () => {
    if (!editing?.title || !editing?.summary || !editing?.valid_until) return;

    const hash = `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const record = {
      title: editing.title,
      summary: editing.summary,
      source: 'manual',
      source_url: editing.source_url || null,
      priority: editing.priority || 50,
      valid_until: editing.valid_until,
      type: editing.type || 'general',
      hash: editing.id ? undefined : hash,
    };

    if (editing.id) {
      const { hash: _, ...updateRecord } = record;
      await supabase.from('city_alerts').update(updateRecord).eq('id', editing.id);
    } else {
      await supabase.from('city_alerts').insert({ ...record, hash });
    }
    setEditing(null);
    fetchAlerts();
    toast({ title: 'Saved' });
  };

  const deleteAlert = async (id: string) => {
    await supabase.from('city_alerts').delete().eq('id', id);
    fetchAlerts();
    toast({ title: 'Deleted' });
  };

  const newAlert = (): Partial<CityAlert> => ({
    title: '',
    summary: '',
    type: 'general',
    priority: 50,
    valid_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
  });

  const isExpired = (d: string) => new Date(d) < new Date();

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <p className="text-sm text-muted-foreground">{alerts.length} alerts</p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={runScrapers} disabled={scraping}>
            <RefreshCw className={`h-4 w-4 mr-1 ${scraping ? 'animate-spin' : ''}`} />
            {scraping ? 'Scraping...' : 'Run scrapers'}
          </Button>
          <Button size="sm" onClick={() => setEditing(newAlert())}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
      </div>

      {editing && (
        <Card className="mb-4 border-primary/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{editing.id ? 'Edit' : 'New'} Alert</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Title (max 40)</Label>
              <Input maxLength={40} value={editing.title || ''} onChange={e => setEditing({ ...editing, title: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Summary (max 80)</Label>
              <Input maxLength={80} value={editing.summary || ''} onChange={e => setEditing({ ...editing, summary: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Type</Label>
                <Select value={editing.type || 'general'} onValueChange={v => setEditing({ ...editing, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="traffic">Traffic</SelectItem>
                    <SelectItem value="roads">Roads</SelectItem>
                    <SelectItem value="sport">Sport</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="weather">Weather</SelectItem>
                    <SelectItem value="power">Power</SelectItem>
                    <SelectItem value="water">Water</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Priority (0-100)</Label>
                <Input type="number" min={0} max={100} value={editing.priority || 50} onChange={e => setEditing({ ...editing, priority: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Valid until</Label>
                <Input type="datetime-local" value={editing.valid_until?.slice(0, 16) || ''} onChange={e => setEditing({ ...editing, valid_until: new Date(e.target.value).toISOString() })} />
              </div>
              <div>
                <Label className="text-xs">Source URL</Label>
                <Input value={editing.source_url || ''} onChange={e => setEditing({ ...editing, source_url: e.target.value })} placeholder="https://..." />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={saveAlert}><Save className="h-4 w-4 mr-1" /> Save</Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {alerts.map(a => (
          <Card key={a.id} className={isExpired(a.valid_until) ? 'opacity-40' : ''}>
            <CardContent className="p-3 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm text-foreground truncate">{a.title}</span>
                  <Badge variant="secondary" className="text-[10px]">{a.type}</Badge>
                  <Badge variant="outline" className="text-[10px]">{a.source}</Badge>
                  <Badge variant={a.priority >= 80 ? 'destructive' : 'secondary'} className="text-[10px]">P{a.priority}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{a.summary}</p>
              </div>
              <div className="flex gap-1 ml-2">
                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteAlert(a.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {alerts.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No alerts. Add one or run scrapers.</p>}
      </div>
    </div>
  );
}
