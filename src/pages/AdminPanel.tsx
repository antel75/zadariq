import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Shield, Plus, Pencil, LogOut, ArrowLeft, Trash2, Save } from 'lucide-react';
import { PendingChangesTab } from '@/components/admin/PendingChangesTab';
import { ApprovedPlacesTab } from '@/components/admin/ApprovedPlacesTab';
import { CityAlertsTab } from '@/components/admin/CityAlertsTab';
import { SportsEventsTab } from '@/components/admin/SportsEventsTab';
import { BusinessHoursTab } from '@/components/admin/BusinessHoursTab';
import { ShopSundayTab } from '@/components/admin/ShopSundayTab';
import { OutagesTab } from '@/components/admin/OutagesTab';
import { EventsTab } from '@/components/admin/EventsTab';

type DutyService = {
  id: string;
  type: string;
  name: string;
  address: string | null;
  phone: string | null;
  valid_from: string;
  valid_until: string;
  source: string;
  notes: string | null;
  enabled: boolean;
};

type TransportSchedule = {
  id: string;
  type: string;
  line_name: string;
  route: string | null;
  departure_time: string;
  port_or_station: string | null;
  destination: string | null;
  carrier: string | null;
  platform: string | null;
  valid_from: string;
  valid_until: string;
  source: string;
  enabled: boolean;
};

const today = () => new Date().toISOString().split('T')[0];

const AdminPanel = () => {
  const { user, loading, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [dutyServices, setDutyServices] = useState<DutyService[]>([]);
  const [transports, setTransports] = useState<TransportSchedule[]>([]);
  const [editingDuty, setEditingDuty] = useState<Partial<DutyService> | null>(null);
  const [editingTransport, setEditingTransport] = useState<Partial<TransportSchedule> | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate('/admin/login');
    if (!loading && user && !isAdmin) {
      toast({ title: 'Access denied', description: 'You are not an admin.', variant: 'destructive' });
      navigate('/');
    }
  }, [loading, user, isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      fetchDutyServices();
      fetchTransports();
    }
  }, [isAdmin]);

  const fetchDutyServices = async () => {
    // Admin reads all (RLS allows admin to see all)
    const { data } = await supabase.from('duty_services').select('*').order('valid_until', { ascending: false });
    if (data) setDutyServices(data as unknown as DutyService[]);
  };

  const fetchTransports = async () => {
    const { data } = await supabase.from('transport_schedules').select('*').order('departure_time');
    if (data) setTransports(data as unknown as TransportSchedule[]);
  };

  const saveDutyService = async () => {
    if (!editingDuty?.name || !editingDuty?.type) return;
    const record = {
      type: editingDuty.type as 'pharmacy' | 'dentist' | 'doctor' | 'night_service',
      name: editingDuty.name,
      address: editingDuty.address || null,
      phone: editingDuty.phone || null,
      valid_from: editingDuty.valid_from || today(),
      valid_until: editingDuty.valid_until || today(),
      source: (editingDuty.source || 'official') as 'phone' | 'website' | 'official' | 'owner_confirmed',
      notes: editingDuty.notes || null,
      enabled: editingDuty.enabled ?? true,
    };

    if (editingDuty.id) {
      await supabase.from('duty_services').update(record).eq('id', editingDuty.id);
    } else {
      await supabase.from('duty_services').insert(record);
    }
    setEditingDuty(null);
    fetchDutyServices();
    toast({ title: 'Saved' });
  };

  const deleteDutyService = async (id: string) => {
    await supabase.from('duty_services').delete().eq('id', id);
    fetchDutyServices();
    toast({ title: 'Deleted' });
  };

  const saveTransport = async () => {
    if (!editingTransport?.line_name || !editingTransport?.type || !editingTransport?.departure_time) return;
    const record = {
      type: editingTransport.type as 'ferry' | 'catamaran' | 'city_bus' | 'intercity_bus',
      line_name: editingTransport.line_name,
      route: editingTransport.route || null,
      departure_time: editingTransport.departure_time,
      port_or_station: editingTransport.port_or_station || null,
      destination: editingTransport.destination || null,
      carrier: editingTransport.carrier || null,
      platform: editingTransport.platform || null,
      valid_from: editingTransport.valid_from || today(),
      valid_until: editingTransport.valid_until || '2099-12-31',
      source: (editingTransport.source || 'official') as 'phone' | 'website' | 'official' | 'owner_confirmed',
      enabled: editingTransport.enabled ?? true,
    };

    if (editingTransport.id) {
      await supabase.from('transport_schedules').update(record).eq('id', editingTransport.id);
    } else {
      await supabase.from('transport_schedules').insert(record);
    }
    setEditingTransport(null);
    fetchTransports();
    toast({ title: 'Saved' });
  };

  const deleteTransport = async (id: string) => {
    await supabase.from('transport_schedules').delete().eq('id', id);
    fetchTransports();
    toast({ title: 'Deleted' });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!isAdmin) return null;

  const newDuty = (): Partial<DutyService> => ({ type: 'pharmacy', name: '', valid_from: today(), valid_until: today(), source: 'official', enabled: true });
  const newTransport = (): Partial<TransportSchedule> => ({ type: 'ferry', line_name: '', departure_time: '08:00', valid_from: today(), valid_until: '2099-12-31', source: 'official', enabled: true });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="p-2 text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /></button>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-bold text-foreground">Admin Panel</h1>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="h-4 w-4 mr-1" /> Logout</Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4">
        <Tabs defaultValue="duty">
          <TabsList className="w-full flex-wrap h-auto gap-1 py-1">
            <TabsTrigger value="duty" className="flex-1 text-xs">Duty</TabsTrigger>
            <TabsTrigger value="transport" className="flex-1 text-xs">Transport</TabsTrigger>
            <TabsTrigger value="sports" className="flex-1 text-xs">Sport</TabsTrigger>
            <TabsTrigger value="alerts" className="flex-1 text-xs">Alerts</TabsTrigger>
            <TabsTrigger value="cafes" className="flex-1 text-xs">Cafes</TabsTrigger>
            <TabsTrigger value="hours" className="flex-1 text-xs">Sati</TabsTrigger>
            <TabsTrigger value="sundays" className="flex-1 text-xs">Ned.</TabsTrigger>
            <TabsTrigger value="outages" className="flex-1 text-xs">Outages</TabsTrigger>
            <TabsTrigger value="corrections" className="flex-1 text-xs">Corrections</TabsTrigger>
            <TabsTrigger value="events" className="flex-1 text-xs">Eventi</TabsTrigger>
          </TabsList>

          {/* DUTY SERVICES */}
          <TabsContent value="duty">
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm text-muted-foreground">{dutyServices.length} entries</p>
              <Button size="sm" onClick={() => setEditingDuty(newDuty())}><Plus className="h-4 w-4 mr-1" /> Add</Button>
            </div>

            {editingDuty && (
              <Card className="mb-4 border-primary/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{editingDuty.id ? 'Edit' : 'New'} Duty Service</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Type</Label>
                      <Select value={editingDuty.type} onValueChange={v => setEditingDuty({ ...editingDuty, type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pharmacy">Pharmacy</SelectItem>
                          <SelectItem value="dentist">Dentist</SelectItem>
                          <SelectItem value="doctor">Doctor</SelectItem>
                          <SelectItem value="night_service">Night Service</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Source</Label>
                      <Select value={editingDuty.source} onValueChange={v => setEditingDuty({ ...editingDuty, source: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="phone">Phone</SelectItem>
                          <SelectItem value="website">Website</SelectItem>
                          <SelectItem value="official">Official</SelectItem>
                          <SelectItem value="owner_confirmed">Owner Confirmed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Name</Label>
                    <Input value={editingDuty.name || ''} onChange={e => setEditingDuty({ ...editingDuty, name: e.target.value })} placeholder="e.g. Ljekarna Donat" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Address</Label>
                      <Input value={editingDuty.address || ''} onChange={e => setEditingDuty({ ...editingDuty, address: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Phone</Label>
                      <Input value={editingDuty.phone || ''} onChange={e => setEditingDuty({ ...editingDuty, phone: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Valid from</Label>
                      <Input type="date" value={editingDuty.valid_from || ''} onChange={e => setEditingDuty({ ...editingDuty, valid_from: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Valid until</Label>
                      <Input type="date" value={editingDuty.valid_until || ''} onChange={e => setEditingDuty({ ...editingDuty, valid_until: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Notes</Label>
                    <Input value={editingDuty.notes || ''} onChange={e => setEditingDuty({ ...editingDuty, notes: e.target.value })} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={editingDuty.enabled ?? true} onCheckedChange={v => setEditingDuty({ ...editingDuty, enabled: v })} />
                    <Label className="text-xs">Enabled</Label>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={saveDutyService}><Save className="h-4 w-4 mr-1" /> Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingDuty(null)}>Cancel</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              {dutyServices.map(d => (
                <Card key={d.id} className={`${!d.enabled ? 'opacity-50' : ''}`}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-foreground truncate">{d.name}</span>
                        <Badge variant="secondary" className="text-[10px]">{d.type}</Badge>
                        <Badge variant="outline" className="text-[10px]">{d.source}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {d.valid_from} → {d.valid_until} {d.address && `· ${d.address}`}
                      </p>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingDuty(d)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteDutyService(d.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {dutyServices.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No duty services yet. Add one above.</p>}
            </div>
          </TabsContent>

          {/* TRANSPORT SCHEDULES */}
          <TabsContent value="transport">
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm text-muted-foreground">{transports.length} entries</p>
              <Button size="sm" onClick={() => setEditingTransport(newTransport())}><Plus className="h-4 w-4 mr-1" /> Add</Button>
            </div>

            {editingTransport && (
              <Card className="mb-4 border-primary/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{editingTransport.id ? 'Edit' : 'New'} Transport Schedule</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Type</Label>
                      <Select value={editingTransport.type} onValueChange={v => setEditingTransport({ ...editingTransport, type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ferry">Ferry</SelectItem>
                          <SelectItem value="catamaran">Catamaran</SelectItem>
                          <SelectItem value="city_bus">City Bus</SelectItem>
                          <SelectItem value="intercity_bus">Intercity Bus</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Source</Label>
                      <Select value={editingTransport.source} onValueChange={v => setEditingTransport({ ...editingTransport, source: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="phone">Phone</SelectItem>
                          <SelectItem value="website">Website</SelectItem>
                          <SelectItem value="official">Official</SelectItem>
                          <SelectItem value="owner_confirmed">Owner Confirmed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Line / Name</Label>
                      <Input value={editingTransport.line_name || ''} onChange={e => setEditingTransport({ ...editingTransport, line_name: e.target.value })} placeholder="e.g. Line 4" />
                    </div>
                    <div>
                      <Label className="text-xs">Departure time</Label>
                      <Input type="time" value={editingTransport.departure_time || ''} onChange={e => setEditingTransport({ ...editingTransport, departure_time: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Route</Label>
                      <Input value={editingTransport.route || ''} onChange={e => setEditingTransport({ ...editingTransport, route: e.target.value })} placeholder="e.g. Zadar → Preko" />
                    </div>
                    <div>
                      <Label className="text-xs">Destination</Label>
                      <Input value={editingTransport.destination || ''} onChange={e => setEditingTransport({ ...editingTransport, destination: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Port / Station</Label>
                      <Input value={editingTransport.port_or_station || ''} onChange={e => setEditingTransport({ ...editingTransport, port_or_station: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Carrier</Label>
                      <Input value={editingTransport.carrier || ''} onChange={e => setEditingTransport({ ...editingTransport, carrier: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">Platform</Label>
                      <Input value={editingTransport.platform || ''} onChange={e => setEditingTransport({ ...editingTransport, platform: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Valid from</Label>
                      <Input type="date" value={editingTransport.valid_from || ''} onChange={e => setEditingTransport({ ...editingTransport, valid_from: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Valid until</Label>
                      <Input type="date" value={editingTransport.valid_until || ''} onChange={e => setEditingTransport({ ...editingTransport, valid_until: e.target.value })} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={editingTransport.enabled ?? true} onCheckedChange={v => setEditingTransport({ ...editingTransport, enabled: v })} />
                    <Label className="text-xs">Enabled</Label>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={saveTransport}><Save className="h-4 w-4 mr-1" /> Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingTransport(null)}>Cancel</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              {transports.map(t => (
                <Card key={t.id} className={`${!t.enabled ? 'opacity-50' : ''}`}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-foreground">{t.line_name}</span>
                        <Badge variant="secondary" className="text-[10px]">{t.type}</Badge>
                        <span className="text-xs font-mono text-muted-foreground">{t.departure_time?.slice(0, 5)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t.destination && `→ ${t.destination}`} {t.port_or_station && `· ${t.port_or_station}`} · {t.valid_from} → {t.valid_until}
                      </p>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingTransport(t)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteTransport(t.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {transports.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No transport schedules yet. Add one above.</p>}
            </div>
          </TabsContent>
          <TabsContent value="sports">
            <SportsEventsTab />
          </TabsContent>
          <TabsContent value="alerts">
            <CityAlertsTab />
          </TabsContent>
          <TabsContent value="cafes">
            <ApprovedPlacesTab />
          </TabsContent>
          <TabsContent value="hours">
            <BusinessHoursTab />
          </TabsContent>
          <TabsContent value="sundays">
            <ShopSundayTab />
          </TabsContent>
          <TabsContent value="outages"><OutagesTab /></TabsContent>
          <TabsContent value="events"><EventsTab /></TabsContent>
          <TabsContent value="corrections">
            <PendingChangesTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminPanel;
