import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Save, AlertTriangle, CheckCircle2, Pencil } from 'lucide-react';
import { SPORTS_LEAGUES, ALL_TEAMS, canTeamsPlay, getTeamTag } from '@/data/sportsTeamsWhitelist';

type SportsEvent = {
  id: string;
  sport: string;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  match_status: string;
  start_time: string;
  league: string | null;
  venue: string | null;
  team_tag: string | null;
  source: string;
  is_stale: boolean | null;
  api_match_id: string | null;
};

type NewEvent = {
  sport: string;
  home_team: string;
  away_team: string;
  home_score: string;
  away_score: string;
  match_status: string;
  start_time: string;
  league: string;
  venue: string;
  team_tag: string;
};

type InlineEdit = {
  id: string;
  home_score: string;
  away_score: string;
  match_status: string;
  match_minute: string;
};

const today = () => {
  const d = new Date();
  return d.toISOString().slice(0, 16); // datetime-local format
};

export const SportsEventsTab = () => {
  const { toast } = useToast();
  const [events, setEvents] = useState<SportsEvent[]>([]);
  const [editing, setEditing] = useState<NewEvent | null>(null);
  const [inlineEdit, setInlineEdit] = useState<InlineEdit | null>(null);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    const { data } = await supabase
      .from('sports_events')
      .select('*')
      .order('start_time', { ascending: false })
      .limit(50);
    if (data) setEvents(data as unknown as SportsEvent[]);
  };

  // Filter teams based on selected sport
  const filteredLeagues = useMemo(() => {
    if (!editing) return [];
    return SPORTS_LEAGUES.filter(l => l.sport === editing.sport);
  }, [editing?.sport]);

  const filteredTeams = useMemo(() => {
    if (!editing?.league) return ALL_TEAMS;
    const league = SPORTS_LEAGUES.find(l => l.league === editing.league);
    return league ? league.teams : ALL_TEAMS;
  }, [editing?.league]);

  // Validate match whenever teams change
  useEffect(() => {
    if (!editing?.home_team || !editing?.away_team) {
      setValidationWarning(null);
      return;
    }
    const result = canTeamsPlay(editing.home_team, editing.away_team);
    setValidationWarning(result.valid ? null : result.reason || null);
  }, [editing?.home_team, editing?.away_team]);

  const saveEvent = async () => {
    if (!editing?.home_team || !editing?.away_team || !editing?.start_time) {
      toast({ title: 'Greška', description: 'Domaćin, gost i vrijeme su obavezni.', variant: 'destructive' });
      return;
    }

    if (validationWarning) {
      toast({ title: 'Blokiran unos', description: validationWarning, variant: 'destructive' });
      return;
    }

    const homeScore = editing.home_score ? parseInt(editing.home_score) : null;
    const awayScore = editing.away_score ? parseInt(editing.away_score) : null;

    // Determine if local team
    const localTags = ['hajduk', 'nk_zadar', 'kk_zadar', 'croatia_nt'];
    const tag = editing.team_tag || getTeamTag(editing.home_team);
    const isLocal = localTags.includes(tag);

    const record = {
      sport: editing.sport,
      home_team: editing.home_team.trim(),
      away_team: editing.away_team.trim(),
      home_score: homeScore,
      away_score: awayScore,
      match_status: editing.match_status,
      start_time: new Date(editing.start_time).toISOString(),
      league: editing.league || null,
      venue: editing.venue || null,
      team_tag: tag,
      source: 'manual' as const,
      is_local_team: isLocal,
      api_match_id: `manual_${tag}_${editing.match_status === 'finished' ? 'last' : 'next'}_${Date.now()}`,
      confidence: 95,
      is_stale: false,
      fetched_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('sports_events').insert(record);
    if (error) {
      toast({ title: 'Greška', description: error.message, variant: 'destructive' });
      return;
    }

    setEditing(null);
    fetchEvents();
    toast({ title: '✅ Spremljeno', description: `${record.home_team} vs ${record.away_team}` });
  };

  const deleteEvent = async (id: string) => {
    await supabase.from('sports_events').delete().eq('id', id);
    fetchEvents();
    toast({ title: 'Obrisano' });
  };

  const startInlineEdit = (ev: SportsEvent) => {
    setInlineEdit({
      id: ev.id,
      home_score: ev.home_score?.toString() || '0',
      away_score: ev.away_score?.toString() || '0',
      match_status: ev.match_status,
      match_minute: '',
    });
  };

  const saveInlineEdit = async () => {
    if (!inlineEdit) return;
    const { error } = await supabase.from('sports_events').update({
      home_score: parseInt(inlineEdit.home_score) || 0,
      away_score: parseInt(inlineEdit.away_score) || 0,
      match_status: inlineEdit.match_status,
      match_minute: inlineEdit.match_minute || null,
    }).eq('id', inlineEdit.id);
    if (error) {
      toast({ title: 'Greška', description: error.message, variant: 'destructive' });
      return;
    }
    setInlineEdit(null);
    fetchEvents();
    toast({ title: '✅ Rezultat ažuriran' });
  };

  const newEvent = (): NewEvent => ({
    sport: 'football',
    home_team: '',
    away_team: '',
    home_score: '',
    away_score: '',
    match_status: 'upcoming',
    start_time: today(),
    league: '',
    venue: '',
    team_tag: '',
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <p className="text-sm text-muted-foreground">{events.length} events</p>
        <Button size="sm" onClick={() => setEditing(newEvent())}>
          <Plus className="h-4 w-4 mr-1" /> Dodaj utakmicu
        </Button>
      </div>

      {editing && (
        <Card className="mb-4 border-primary/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Nova sportska utakmica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Sport & League */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Sport</Label>
                <Select value={editing.sport} onValueChange={v => setEditing({ ...editing, sport: v, league: '', home_team: '', away_team: '' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="football">⚽ Nogomet</SelectItem>
                    <SelectItem value="basketball">🏀 Košarka</SelectItem>
                    <SelectItem value="f1">🏎️ Formula 1</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Liga / Natjecanje</Label>
                <Select value={editing.league} onValueChange={v => setEditing({ ...editing, league: v, home_team: '', away_team: '' })}>
                  <SelectTrigger><SelectValue placeholder="Odaberi ligu" /></SelectTrigger>
                  <SelectContent>
                    {filteredLeagues.map(l => (
                      <SelectItem key={l.league} value={l.league}>{l.league}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Teams */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Domaćin</Label>
                {filteredTeams.length > 0 && editing.league ? (
                  <Select value={editing.home_team} onValueChange={v => setEditing({ ...editing, home_team: v, team_tag: getTeamTag(v) })}>
                    <SelectTrigger><SelectValue placeholder="Odaberi tim" /></SelectTrigger>
                    <SelectContent>
                      {filteredTeams.map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input 
                    value={editing.home_team} 
                    onChange={e => setEditing({ ...editing, home_team: e.target.value, team_tag: getTeamTag(e.target.value) })} 
                    placeholder="Ime domaćeg tima" 
                  />
                )}
              </div>
              <div>
                <Label className="text-xs">Gost</Label>
                {filteredTeams.length > 0 && editing.league ? (
                  <Select value={editing.away_team} onValueChange={v => setEditing({ ...editing, away_team: v })}>
                    <SelectTrigger><SelectValue placeholder="Odaberi tim" /></SelectTrigger>
                    <SelectContent>
                      {filteredTeams.filter(t => t !== editing.home_team).map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input 
                    value={editing.away_team} 
                    onChange={e => setEditing({ ...editing, away_team: e.target.value })} 
                    placeholder="Ime gostujućeg tima" 
                  />
                )}
              </div>
            </div>

            {/* Validation warning */}
            {validationWarning && (
              <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/30">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                <p className="text-xs text-destructive">{validationWarning}</p>
              </div>
            )}

            {editing.home_team && editing.away_team && !validationWarning && (
              <div className="flex items-center gap-2 p-2 rounded-md bg-primary/10 border border-primary/20">
                <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                <p className="text-xs text-primary">Utakmica je validna ✓</p>
              </div>
            )}

            {/* Status & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Status</Label>
                <Select value={editing.match_status} onValueChange={v => setEditing({ ...editing, match_status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Nadolazeća</SelectItem>
                    <SelectItem value="live">LIVE</SelectItem>
                    <SelectItem value="finished">Završena</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Datum i vrijeme</Label>
                <Input 
                  type="datetime-local" 
                  value={editing.start_time} 
                  onChange={e => setEditing({ ...editing, start_time: e.target.value })} 
                />
              </div>
            </div>

            {/* Score (only if finished/live) */}
            {(editing.match_status === 'finished' || editing.match_status === 'live') && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Rezultat domaćin</Label>
                  <Input 
                    type="number" min="0" max="99"
                    value={editing.home_score} 
                    onChange={e => setEditing({ ...editing, home_score: e.target.value })} 
                    placeholder="0" 
                  />
                </div>
                <div>
                  <Label className="text-xs">Rezultat gost</Label>
                  <Input 
                    type="number" min="0" max="99"
                    value={editing.away_score} 
                    onChange={e => setEditing({ ...editing, away_score: e.target.value })} 
                    placeholder="0" 
                  />
                </div>
              </div>
            )}

            {/* Venue & Tag */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Stadion / Dvorana</Label>
                <Input 
                  value={editing.venue} 
                  onChange={e => setEditing({ ...editing, venue: e.target.value })} 
                  placeholder="npr. Stadion Stanovi" 
                />
              </div>
              <div>
                <Label className="text-xs">Team tag</Label>
                <Input 
                  value={editing.team_tag} 
                  onChange={e => setEditing({ ...editing, team_tag: e.target.value })} 
                  placeholder="auto-generirano" 
                  className="text-muted-foreground"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button size="sm" onClick={saveEvent} disabled={!!validationWarning}>
                <Save className="h-4 w-4 mr-1" /> Spremi
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setEditing(null); setValidationWarning(null); }}>Odustani</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Event list */}
      <div className="space-y-2">
        {events.map(ev => (
          <Card key={ev.id} className={ev.is_stale ? 'opacity-40' : ''}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-foreground truncate">
                      {ev.home_team} {ev.home_score !== null ? `${ev.home_score}:${ev.away_score}` : 'vs'} {ev.away_team}
                    </span>
                    <Badge variant={ev.match_status === 'live' ? 'destructive' : ev.match_status === 'finished' ? 'secondary' : 'outline'} className="text-[10px]">
                      {ev.match_status}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">{ev.source}</Badge>
                    {ev.is_stale && <Badge variant="destructive" className="text-[10px]">STALE</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(ev.start_time).toLocaleDateString('hr')} · {ev.league || ev.sport} · {ev.team_tag}
                  </p>
                </div>
                <div className="flex gap-1 ml-2">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => startInlineEdit(ev)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  {ev.source === 'manual' && (
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteEvent(ev.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Inline edit panel */}
              {inlineEdit?.id === ev.id && (
                <div className="mt-3 pt-3 border-t border-border space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs">Domaćin</Label>
                      <Input
                        type="number" min="0"
                        value={inlineEdit.home_score}
                        onChange={e => setInlineEdit({ ...inlineEdit, home_score: e.target.value })}
                        className="h-9"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Gost</Label>
                      <Input
                        type="number" min="0"
                        value={inlineEdit.away_score}
                        onChange={e => setInlineEdit({ ...inlineEdit, away_score: e.target.value })}
                        className="h-9"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Minuta</Label>
                      <Input
                        value={inlineEdit.match_minute}
                        onChange={e => setInlineEdit({ ...inlineEdit, match_minute: e.target.value })}
                        placeholder="npr. 45"
                        className="h-9"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={inlineEdit.match_status} onValueChange={v => setInlineEdit({ ...inlineEdit, match_status: v })}>
                      <SelectTrigger className="h-9 w-36"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="upcoming">Nadolazeća</SelectItem>
                        <SelectItem value="live">LIVE</SelectItem>
                        <SelectItem value="finished">Završena</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="sm" onClick={saveInlineEdit}>
                      <Save className="h-3.5 w-3.5 mr-1" /> Spremi
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setInlineEdit(null)}>Odustani</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {events.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nema sportskih događaja.</p>}
      </div>
    </div>
  );
};
