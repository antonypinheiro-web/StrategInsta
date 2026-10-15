import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAskDialog } from '@/components/AskDialog';
import { parseSavedStrategy } from '@/lib/saved-strategy';
import type { SavedStrategy } from '@/lib/saved-strategy';

interface Props {
  userId: string; currentId?: string;
  onOpen: (strategy: SavedStrategy) => void;
  /** Lets the open strategy follow a rename made from the list. */
  onRenamed?: (id: string, name: string) => void;
}
interface Summary { id: string; name: string; updated_at: string }

export function SavedStrategiesDialog({ userId, currentId, onOpen, onRenamed }: Props) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState<string>();
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState(20);
  const [hasMore, setHasMore] = useState(false);
  const [reload, setReload] = useState(0);
  const { ask, dialog } = useAskDialog();
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
          // Archived strategies stay in the database but leave the user's list.
          .or('generated_strategy->>archived.is.null,generated_strategy->>archived.neq.true')
          .order('updated_at', { ascending: false }).limit(limit + 1);
        if (queryError) throw queryError;
        if (active) { setRows((data ?? []).slice(0, limit)); setHasMore((data ?? []).length > limit); }
      } catch { if (active) setError('Não foi possível consultar suas estratégias. Feche e tente novamente.'); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [open, userId, limit, reload]);

  const run = useCallback(async (id: string, action: () => Promise<void>) => {
    if (working) return;
    setWorking(id); setError(null);
    try { await action(); } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível concluir.'); }
    finally { if (mounted.current) setWorking(undefined); }
  }, [working]);

  const loadFull = async (id: string) => {
    const { data, error: queryError } = await supabase.from('strategies')
      .select('id,user_id,name,user_input,generated_strategy,history').eq('user_id', userId).eq('id', id).single();
    if (queryError || !data) throw new Error('Não foi possível abrir a estratégia. Tente novamente.');
    return data;
  };

  const openSaved = (id: string) => run(id, async () => {
    const data = await loadFull(id);
    if (!mounted.current) return;
    onOpen(parseSavedStrategy(data, userId));
    setOpen(false);
  });

  const rename = (row: Summary) => run(row.id, async () => {
    const answer = await ask({ title: 'Renomear estratégia', fields: [{ name: 'name', label: 'Nome', defaultValue: row.name }], confirmLabel: 'Salvar nome' });
    const name = answer?.name.trim().slice(0, 120);
    if (!name || name === row.name) return;
    const { error: updateError } = await supabase.from('strategies').update({ name }).eq('user_id', userId).eq('id', row.id);
    if (updateError) throw new Error('Não foi possível renomear. Tente novamente.');
    onRenamed?.(row.id, name);
    toast.success('Nome atualizado.'); setReload(value => value + 1);
  });

  const duplicate = (row: Summary) => run(row.id, async () => {
    const data = await loadFull(row.id);
    const { error: insertError } = await supabase.from('strategies').insert({ id: crypto.randomUUID(), user_id: userId, name: `${data.name} (cópia)`.slice(0, 120),
      user_input: data.user_input, generated_strategy: data.generated_strategy, history: data.history });
    if (insertError) throw new Error('Não foi possível duplicar. Tente novamente.');
    toast.success('Cópia criada.'); setReload(value => value + 1);
  });

  const archive = (row: Summary) => run(row.id, async () => {
    if (!await ask({ title: `Arquivar "${row.name}"?`, description: 'A estratégia sai da sua lista, mas não é apagada. Para recuperar, fale com o suporte.', confirmLabel: 'Arquivar', destructive: true })) return;
    const data = await loadFull(row.id);
    const strategy = data.generated_strategy && typeof data.generated_strategy === 'object' && !Array.isArray(data.generated_strategy) ? data.generated_strategy as Record<string, unknown> : {};
    const { error: updateError } = await supabase.from('strategies').update({ generated_strategy: { ...strategy, archived: true } }).eq('user_id', userId).eq('id', row.id);
    if (updateError) throw new Error('Não foi possível arquivar. Tente novamente.');
    toast.success('Estratégia arquivada.'); setReload(value => value + 1);
  });

  return <>
    {dialog}
    <Button variant="outline" onClick={() => setOpen(true)}>Estratégias salvas</Button>
    <Dialog open={open} onOpenChange={value => { if (!working) setOpen(value); }}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader><DialogTitle>Suas estratégias</DialogTitle><DialogDescription>Abra, renomeie, duplique ou arquive. Nada aqui usa TPs.</DialogDescription></DialogHeader>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {loading ? <p role="status">Buscando estratégias...</p> : <div className="space-y-3">
          {!rows.length && !error && <p>Nenhuma estratégia salva ainda.</p>}
          {rows.map(row => <div key={row.id} className="space-y-3 rounded-xl border border-border p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0"><p className="break-words font-medium">{row.name}</p><p className="mt-1 text-xs text-muted-foreground">Atualizada em {new Date(row.updated_at).toLocaleDateString('pt-BR')}</p></div>
              {row.id === currentId ? <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Aberta agora</span>
                : <Button size="sm" disabled={!!working} onClick={() => void openSaved(row.id)} aria-label={`Abrir ${row.name}`}>{working === row.id ? 'Aguarde...' : 'Abrir'}</Button>}
            </div>
            <div className="flex flex-wrap gap-1 border-t pt-2">
              <Button size="sm" variant="ghost" disabled={!!working} onClick={() => void rename(row)}>Renomear</Button>
              <Button size="sm" variant="ghost" disabled={!!working} onClick={() => void duplicate(row)}>Duplicar</Button>
              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" disabled={!!working || row.id === currentId} title={row.id === currentId ? 'Abra outra estratégia antes de arquivar esta' : undefined} onClick={() => void archive(row)}>Arquivar</Button>
            </div>
          </div>)}
          {hasMore && <Button variant="ghost" disabled={!!working} onClick={() => setLimit(value => value + 20)}>Carregar mais</Button>}
        </div>}
      </DialogContent>
    </Dialog>
  </>;
}
