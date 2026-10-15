import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface FeedbackRow { id: string; user_id: string; kind: 'bug' | 'idea' | 'other'; message: string; page: string | null; app_version: string | null; created_at: string }
const KIND = { bug: { label: 'Bug', className: 'bg-red-500/10 text-red-600 dark:text-red-400' }, idea: { label: 'Sugestão', className: 'bg-primary/10 text-primary' }, other: { label: 'Outro', className: 'bg-muted text-muted-foreground' } };

/** Feedback and bug reports sent from the account menu (read allowed to active admins by RLS). */
export function AdminFeedbackTable({ emails }: { emails: Record<string, string | undefined> }) {
  const [rows, setRows] = useState<FeedbackRow[]>();
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setError('');
    const { data, error: queryError } = await supabase.from('user_feedback' as never).select('id,user_id,kind,message,page,app_version,created_at').order('created_at', { ascending: false }).limit(200);
    if (queryError) { setError('Não foi possível carregar os feedbacks.'); return; }
    setRows((data ?? []) as unknown as FeedbackRow[]);
  }, []);
  useEffect(() => { void load(); }, [load]);
  return <div className="space-y-3">
    <div className="flex items-center justify-between gap-3"><p className="text-sm text-muted-foreground">Mensagens enviadas pelo menu da conta (Feedback e bugs).</p><Button size="sm" variant="outline" onClick={() => void load()}>Atualizar</Button></div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {!rows ? <p className="text-sm text-muted-foreground">Carregando...</p> : !rows.length ? <p className="rounded-xl border p-5 text-sm text-muted-foreground">Nenhum feedback ainda.</p>
      : <ul className="space-y-2">{rows.map(row => <li key={row.id} className="rounded-xl border bg-card p-4">
        <div className="flex flex-wrap items-center gap-2 text-xs"><span className={`rounded-full px-2 py-0.5 font-medium ${KIND[row.kind]?.className ?? ''}`}>{KIND[row.kind]?.label ?? row.kind}</span><span className="text-muted-foreground">{emails[row.user_id] ?? row.user_id} · {new Date(row.created_at).toLocaleString('pt-BR')}{row.page ? ` · ${row.page}` : ''}{row.app_version ? ` · v${row.app_version}` : ''}</span></div>
        <p className="mt-2 whitespace-pre-wrap text-sm">{row.message}</p>
      </li>)}</ul>}
  </div>;
}
