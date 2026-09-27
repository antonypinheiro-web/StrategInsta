import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { parseSavedStrategy } from '@/lib/saved-strategy';
import type { SavedStrategy } from '@/lib/saved-strategy';

interface Props { userId: string; onOpen: (strategy: SavedStrategy) => void }
interface Summary { id: string; name: string; updated_at: string }

export function SavedStrategiesDialog({ userId, onOpen }: Props) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(false);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState(20);
  const [hasMore, setHasMore] = useState(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true); setError(null);
    void (async () => {
      try {
        const { data, error: queryError } = await supabase.from('strategies')
          .select('id,name,updated_at').eq('user_id', userId)
          .order('updated_at', { ascending: false }).limit(limit + 1);
        if (queryError) throw queryError;
        if (active) { setRows((data ?? []).slice(0, limit)); setHasMore((data ?? []).length > limit); }
      } catch { if (active) setError('Não foi possível consultar suas estratégias. Feche e tente novamente.'); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [open, userId, limit]);

  async function openSaved(id: string) {
    if (opening) return;
    setOpening(true); setError(null);
    try {
      const { data, error: queryError } = await supabase.from('strategies')
        .select('id,user_id,name,user_input,generated_strategy,history').eq('user_id', userId).eq('id', id).single();
      if (queryError || !data) throw new Error('Não foi possível abrir a estratégia. Tente novamente.');
      if (!mounted.current) return;
      onOpen(parseSavedStrategy(data, userId));
      setOpen(false);
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível abrir a estratégia.'); }
    finally { setOpening(false); }
  }

  return <>
    <Button variant="outline" onClick={() => setOpen(true)}>Estratégias salvas</Button>
    <Dialog open={open} onOpenChange={value => { if (!opening) setOpen(value); }}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>Suas estratégias</DialogTitle><DialogDescription>Abra uma estratégia salva na sua conta. Consultar não usa créditos.</DialogDescription></DialogHeader>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {loading ? <p role="status">Buscando estratégias...</p> : <div className="space-y-3">
          {!rows.length && !error && <p>Nenhuma estratégia salva ainda.</p>}
          {rows.map(row => <div key={row.id} className="flex items-center justify-between gap-3 rounded-xl border border-border p-4"><div className="min-w-0"><p className="break-words font-medium">{row.name}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(row.updated_at).toLocaleDateString('pt-BR')}</p></div><Button variant="outline" disabled={opening} onClick={() => void openSaved(row.id)} aria-label={`Abrir ${row.name}`}>{opening ? 'Aguarde...' : 'Abrir'}</Button></div>)}
          {hasMore && <Button variant="ghost" disabled={opening} onClick={() => setLimit(value => value + 20)}>Carregar mais</Button>}
        </div>}
      </DialogContent>
    </Dialog>
  </>;
}
