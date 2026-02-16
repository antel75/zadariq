import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Check, X, ArrowRight } from 'lucide-react';

type PendingChange = {
  id: string;
  entity_type: string;
  entity_id: string;
  field_name: string;
  old_value: string | null;
  proposed_value: string | null;
  status: string;
  confidence_score: number;
  created_at: string;
  fingerprint_hash: string;
};

export function PendingChangesTab() {
  const [changes, setChanges] = useState<PendingChange[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetch = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('pending_changes')
      .select('*')
      .in('status', ['pending', 'approved', 'rejected', 'shadow_rejected'])
      .order('confidence_score', { ascending: false })
      .limit(100);
    if (data) setChanges(data as unknown as PendingChange[]);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const handleAction = async (id: string, newStatus: 'approved' | 'rejected') => {
    await supabase.from('pending_changes').update({ 
      status: newStatus, 
      reviewed_at: new Date().toISOString() 
    }).eq('id', id);
    toast({ title: newStatus === 'approved' ? 'Approved' : 'Rejected' });
    fetch();
  };

  // Count duplicates
  const duplicateCounts: Record<string, number> = {};
  changes.forEach(c => {
    const key = `${c.entity_id}|${c.field_name}|${c.proposed_value}`;
    duplicateCounts[key] = (duplicateCounts[key] || 0) + 1;
  });

  const statusColor = (s: string) => {
    if (s === 'approved') return 'bg-status-open/20 text-status-open';
    if (s === 'rejected') return 'bg-destructive/20 text-destructive';
    if (s === 'shadow_rejected') return 'bg-muted text-muted-foreground';
    return 'bg-accent/20 text-accent';
  };

  const pendingOnly = changes.filter(c => c.status === 'pending');
  const resolvedOnly = changes.filter(c => c.status !== 'pending');

  if (loading) return <p className="text-sm text-muted-foreground text-center py-8">Loading…</p>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{pendingOnly.length} pending, {resolvedOnly.length} resolved</p>
      
      {pendingOnly.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">No pending corrections.</p>
      )}

      {pendingOnly.map(c => {
        const dupKey = `${c.entity_id}|${c.field_name}|${c.proposed_value}`;
        const dupCount = duplicateCounts[dupKey] || 1;

        return (
          <Card key={c.id}>
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-[10px]">{c.entity_type}</Badge>
                <span className="text-xs font-mono text-muted-foreground">{c.entity_id}</span>
                <Badge variant="secondary" className="text-[10px]">{c.field_name}</Badge>
                <span className="text-[10px] text-muted-foreground ml-auto">Score: {c.confidence_score}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground line-through truncate max-w-[120px]">{c.old_value || '—'}</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                <span className="font-medium text-foreground truncate max-w-[120px]">
                  {c.proposed_value === '__DELETED__' ? '🗑 Brisanje' : c.proposed_value || '—'}
                </span>
                {dupCount > 1 && (
                  <Badge className="text-[10px] bg-accent/20 text-accent">{dupCount}x</Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button size="sm" variant="default" className="h-7 text-xs" onClick={() => handleAction(c.id, 'approved')}>
                  <Check className="h-3 w-3 mr-1" /> Approve
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleAction(c.id, 'rejected')}>
                  <X className="h-3 w-3 mr-1" /> Reject
                </Button>
                <span className="text-[10px] text-muted-foreground ml-auto">
                  {new Date(c.created_at).toLocaleDateString('hr')}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {resolvedOnly.length > 0 && (
        <>
          <h3 className="text-xs font-medium text-muted-foreground mt-6">Resolved</h3>
          {resolvedOnly.slice(0, 20).map(c => (
            <Card key={c.id} className="opacity-60">
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs min-w-0">
                  <span className="truncate">{c.entity_id}</span>
                  <span className="text-muted-foreground">·</span>
                  <span>{c.field_name}</span>
                </div>
                <Badge className={`text-[10px] ${statusColor(c.status)}`}>{c.status}</Badge>
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}
